import { storage } from "./storage";
import type { Request, Response } from "express";
import { getAllVideoSeoEntries } from "./video-seo-data";

const SITE = "https://mybible.oscardevs.com";

let sitemapCache: { xml: string; ts: number } | null = null;
const CACHE_TTL = 12 * 60 * 60 * 1000;

// Known emotion types (Arabic slugs)
const EMOTION_TYPES = [
  "فرح", "حزن", "قلق", "خوف", "سلام", "رجاء", "غضب", "شكر",
  "وحدة", "إيمان", "صبر", "حكمة", "محبة", "شفاء",
];

// Children story IDs (static — matches children-stories-data.ts)
const KIDS_STORY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Reading plan IDs
const PLAN_IDS = [1, 2, 3, 4, 5, 6];

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUrl(loc: string, changefreq: string, priority: string, lastmod: string): string {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Build last N days as ISO date strings (for daily-verse archive)
function lastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

async function generateSitemapXml(): Promise<string> {
  const books = await storage.getAllBooks();
  const today = new Date().toISOString().split("T")[0];

  const urls: string[] = [];

  // ── Static pages ─────────────────────────────────────────────────────────
  const staticPages = [
    { path: "/",         changefreq: "daily",   priority: "1.0" },
    { path: "/bible",    changefreq: "weekly",  priority: "0.9" },
    { path: "/plans",    changefreq: "weekly",  priority: "0.7" },
    { path: "/emotions", changefreq: "weekly",  priority: "0.8" },
    { path: "/kids",     changefreq: "weekly",  priority: "0.7" },
    { path: "/kids/stories", changefreq: "weekly", priority: "0.7" },
    { path: "/search",   changefreq: "weekly",  priority: "0.7" },
    { path: "/about",    changefreq: "monthly", priority: "0.6" },
    { path: "/contact",  changefreq: "monthly", priority: "0.5" },
    { path: "/privacy",  changefreq: "monthly", priority: "0.4" },
    { path: "/daily-verse", changefreq: "daily", priority: "0.8" },
    { path: "/orthodox", changefreq: "daily", priority: "0.8" },
  ];
  for (const page of staticPages) {
    const loc = page.path === "/" ? SITE : `${SITE}${page.path}`;
    urls.push(buildUrl(loc, page.changefreq, page.priority, today));
  }

  // ── Bible books + chapters (priority 0.9 / 0.8) ───────────────────────
  for (const book of books) {
    const bookLoc = `${SITE}/bible?book=${encodeURIComponent(book.name)}`;
    urls.push(buildUrl(bookLoc, "weekly", "0.9", today));

    for (let ch = 1; ch <= book.chaptersCount; ch++) {
      const loc = `${SITE}/bible?book=${encodeURIComponent(book.name)}&chapter=${ch}`;
      urls.push(buildUrl(loc, "monthly", "0.8", today));
    }
  }

  // ── SEO topic pages (priority 0.8) ────────────────────────────────────
  try {
    const topics = await storage.getAllSeoTopicSlugs();
    for (const t of topics) {
      const lastmod = t.updatedAt.toISOString().split("T")[0];
      urls.push(buildUrl(`${SITE}/topics/${t.slug}`, "weekly", "0.8", lastmod));
    }
  } catch (_) {
    // table may not exist yet
  }

  // ── Auto-boost: load high-scoring pages from behavioral metrics ───────
  let boostedUrls: Set<string> = new Set();
  try {
    const topScores = await storage.getTopPageScores(20);
    const SCORE_BOOST_THRESHOLD = 50; // pages with score >= 50 get boosted
    for (const ps of topScores) {
      if (ps.score < SCORE_BOOST_THRESHOLD) continue;
      const priority = ps.score >= 200 ? "1.0" : ps.score >= 100 ? "0.95" : "0.9";
      const pageUrl = ps.pageUrl.startsWith('/') ? ps.pageUrl : `/${ps.pageUrl}`;
      const fullUrl = `${SITE}${pageUrl}`;
      urls.push(buildUrl(fullUrl, "daily", priority, today));
      boostedUrls.add(fullUrl);
    }
  } catch (_) {
    // table may not exist yet — skip
  }

  // ── Emotion type pages (priority 0.8) ─────────────────────────────────
  for (const emotion of EMOTION_TYPES) {
    urls.push(buildUrl(
      `${SITE}/emotions/${encodeURIComponent(emotion)}`,
      "weekly", "0.8", today
    ));
  }

  // ── Reading plan pages (priority 0.7) ─────────────────────────────────
  for (const planId of PLAN_IDS) {
    urls.push(buildUrl(`${SITE}/plans/${planId}`, "weekly", "0.7", today));
  }

  // ── Kids story pages (priority 0.7) ────────────────────────────────────
  for (const storyId of KIDS_STORY_IDS) {
    urls.push(buildUrl(`${SITE}/kids/story/${storyId}`, "weekly", "0.7", today));
  }

  // ── Video pages — Daoud Lamei + kids (priority 0.8) ───────────────────
  const videoEntries = getAllVideoSeoEntries();
  for (const v of videoEntries) {
    urls.push(buildUrl(`${SITE}/video/${v.youtubeId}`, "monthly", "0.8", today));
  }

  // ── Listen pages (priority 0.6) ─────────────────────────────────────
  for (const book of books) {
    for (let ch = 1; ch <= book.chaptersCount; ch++) {
      const loc = `${SITE}/listen/${encodeURIComponent(book.name)}/${ch}`;
      urls.push(buildUrl(loc, "monthly", "0.6", today));
    }
  }

  // ── Daily verse archive — last 30 days (priority 0.7) ─────────────────
  for (const date of lastNDays(30)) {
    urls.push(buildUrl(`${SITE}/daily-verse/${date}`, "daily", "0.7", date));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

export function invalidateSitemapCache() {
  sitemapCache = null;
}

export async function sitemapHandler(_req: Request, res: Response) {
  try {
    if (sitemapCache && Date.now() - sitemapCache.ts < CACHE_TTL) {
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=43200");
      return res.send(sitemapCache.xml);
    }

    const xml = await generateSitemapXml();
    sitemapCache = { xml, ts: Date.now() };

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=43200");
    res.send(xml);
  } catch (err) {
    console.error("[sitemap] Error generating sitemap:", err);
    res.status(500).send("Error generating sitemap");
  }
}

export async function robotsHandler(_req: Request, res: Response) {
  const txt = `User-agent: *
Allow: /
Allow: /bible
Allow: /plans
Allow: /emotions
Allow: /kids
Allow: /search
Allow: /about
Allow: /privacy
Allow: /contact
Allow: /topics/
Allow: /video/
Allow: /listen/
Allow: /daily-verse
Allow: /daily-verse/
Allow: /orthodox

Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(txt);
}
