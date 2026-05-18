import { storage } from "./storage";
import type { Request, Response } from "express";
import { getAllVideoSeoEntries } from "./video-seo-data";
import { agpeyaHoursFull } from "../client/src/lib/agpeya-content";
import { synaxariumMonths } from "../client/src/lib/synaxarium-content";
import { liturgies } from "../client/src/lib/liturgy-content";

const SITE = "https://mybible.oscardevs.com";
const CACHE_TTL = 1 * 60 * 60 * 1000;

// Known emotion types (Arabic slugs)
const EMOTION_TYPES = [
  "فرح", "حزن", "قلق", "خوف", "سلام", "رجاء", "غضب", "شكر",
  "وحدة", "إيمان", "صبر", "حكمة", "محبة", "شفاء",
];

const KIDS_STORY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const PLAN_IDS = [1, 2, 3, 4, 5, 6];

// ── Cache store ───────────────────────────────────────────────────────────────
const caches = new Map<string, { xml: string; ts: number }>();

function getCache(key: string): string | null {
  const c = caches.get(key);
  return c && Date.now() - c.ts < CACHE_TTL ? c.xml : null;
}
function setCache(key: string, xml: string) {
  caches.set(key, { xml, ts: Date.now() });
}

export function invalidateSitemapCache() {
  caches.clear();
}

// ── XML helpers ───────────────────────────────────────────────────────────────
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

function wrapUrlset(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

function lastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function sendXml(res: Response, xml: string) {
  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
}

// ── Sitemap Index ─────────────────────────────────────────────────────────────
export async function sitemapIndexHandler(_req: Request, res: Response) {
  const cacheKey = "index";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  const today = new Date().toISOString().split("T")[0];
  const sitemaps = [
    "sitemap-pages.xml",
    "sitemap-bible.xml",
    "sitemap-orthodox.xml",
    "sitemap-kholagy.xml",
    "sitemap-topics.xml",
    "sitemap-videos.xml",
    "sitemap-listen.xml",
    "sitemap-churches.xml",
    "sitemap-news.xml",
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>\n    <loc>${SITE}/${s}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`).join("\n")}
</sitemapindex>`;

  setCache(cacheKey, xml);
  sendXml(res, xml);
}

// ── sitemap-pages.xml: static + emotions + plans + kids + daily ───────────────
export async function sitemapPagesHandler(_req: Request, res: Response) {
  const cacheKey = "pages";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  const today = new Date().toISOString().split("T")[0];
  const urls: string[] = [];

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
    { path: "/orthodox", changefreq: "daily",   priority: "0.8" },
    { path: "/orthodox/agpeya", changefreq: "monthly", priority: "0.8" },
    { path: "/orthodox/synaxarium", changefreq: "daily", priority: "0.8" },
    { path: "/orthodox/kholagy", changefreq: "monthly", priority: "0.9" },
    { path: "/orthodox/deacon", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/hymns", changefreq: "monthly", priority: "0.8" },
    { path: "/orthodox/katameros", changefreq: "weekly", priority: "0.8" },
    { path: "/orthodox/saints", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/creed", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/history", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/books", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/qa", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/figures", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/apocrypha", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/tafseer", changefreq: "monthly", priority: "0.8" },
    { path: "/orthodox/maps", changefreq: "monthly", priority: "0.7" },
    { path: "/orthodox/pope-qa", changefreq: "monthly", priority: "0.7" },
    { path: "/kholagy", changefreq: "monthly", priority: "0.9" },
    { path: "/sitemap",  changefreq: "monthly", priority: "0.4" },
    { path: "/terms",    changefreq: "monthly", priority: "0.3" },
    { path: "/premium",  changefreq: "monthly", priority: "0.6" },
    { path: "/church",   changefreq: "weekly",  priority: "0.7" },
    { path: "/challenge", changefreq: "weekly", priority: "0.7" },
  ];
  for (const page of staticPages) {
    const loc = page.path === "/" ? SITE : `${SITE}${page.path}`;
    urls.push(buildUrl(loc, page.changefreq, page.priority, today));
  }

  for (const emotion of EMOTION_TYPES) {
    urls.push(buildUrl(`${SITE}/emotions/${encodeURIComponent(emotion)}`, "weekly", "0.8", today));
  }
  for (const planId of PLAN_IDS) {
    urls.push(buildUrl(`${SITE}/plans/${planId}`, "weekly", "0.7", today));
  }
  for (const storyId of KIDS_STORY_IDS) {
    urls.push(buildUrl(`${SITE}/kids/story/${storyId}`, "weekly", "0.7", today));
  }
  for (const date of lastNDays(30)) {
    urls.push(buildUrl(`${SITE}/daily-verse/${date}`, "daily", "0.7", date));
  }

  // Auto-boost: high-scoring pages
  try {
    const topScores = await storage.getTopPageScores(20);
    for (const ps of topScores) {
      if (ps.score < 50) continue;
      const priority = ps.score >= 200 ? "1.0" : ps.score >= 100 ? "0.95" : "0.9";
      const pageUrl = ps.pageUrl.startsWith('/') ? ps.pageUrl : `/${ps.pageUrl}`;
      urls.push(buildUrl(`${SITE}${pageUrl}`, "daily", priority, today));
    }
  } catch (_) { /* table may not exist */ }

  const xml = wrapUrlset(urls);
  setCache(cacheKey, xml);
  sendXml(res, xml);
}

// ── sitemap-bible.xml: books + chapters ──────────────────────────────────────
export async function sitemapBibleHandler(_req: Request, res: Response) {
  const cacheKey = "bible";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  try {
    const books = await storage.getAllBooks();
    const today = new Date().toISOString().split("T")[0];
    const urls: string[] = [];

    for (const book of books) {
      urls.push(buildUrl(`${SITE}/bible/${encodeURIComponent(book.name)}`, "weekly", "0.9", today));
      for (let ch = 1; ch <= book.chaptersCount; ch++) {
        urls.push(buildUrl(`${SITE}/bible/${encodeURIComponent(book.name)}/${ch}`, "monthly", "0.8", today));
      }
    }

    const xml = wrapUrlset(urls);
    setCache(cacheKey, xml);
    sendXml(res, xml);
  } catch (err) {
    console.error("[sitemap-bible] Error:", err);
    res.status(500).send("Error generating bible sitemap");
  }
}

// ── sitemap-orthodox.xml: agpeya + synaxarium ─────────────────────────────────
export function sitemapOrthodoxHandler(_req: Request, res: Response) {
  const cacheKey = "orthodox";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  const today = new Date().toISOString().split("T")[0];
  const urls: string[] = [];

  for (const hour of agpeyaHoursFull) {
    urls.push(buildUrl(`${SITE}/orthodox/agpeya/${hour.id}`, "monthly", "0.7", today));
  }
  for (const month of synaxariumMonths) {
    for (const dayEntry of month.days) {
      urls.push(buildUrl(`${SITE}/orthodox/synaxarium/${month.id}/${dayEntry.day}`, "monthly", "0.7", today));
    }
  }

  const xml = wrapUrlset(urls);
  setCache(cacheKey, xml);
  sendXml(res, xml);
}

// ── sitemap-kholagy.xml: liturgy pages ───────────────────────────────────────
export function sitemapKholagyHandler(_req: Request, res: Response) {
  const cacheKey = "kholagy";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  const today = new Date().toISOString().split("T")[0];
  const urls: string[] = [];

  for (const liturgy of liturgies) {
    // صفحة القداس الكاملة
    urls.push(buildUrl(`${SITE}/kholagy/${liturgy.id}`, "monthly", "0.9", today));
    // صفحة كل فصل
    for (const chapter of liturgy.chapters) {
      urls.push(buildUrl(`${SITE}/kholagy/${liturgy.id}/${chapter.id}`, "monthly", "0.8", today));
    }
  }

  const xml = wrapUrlset(urls);
  setCache(cacheKey, xml);
  sendXml(res, xml);
}

// ── sitemap-topics.xml: SEO topic pages ──────────────────────────────────────
export async function sitemapTopicsHandler(_req: Request, res: Response) {
  const cacheKey = "topics";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  const urls: string[] = [];
  try {
    const topics = await storage.getAllSeoTopicSlugs();
    for (const t of topics) {
      const lastmod = t.updatedAt.toISOString().split("T")[0];
      urls.push(buildUrl(`${SITE}/topics/${t.slug}`, "weekly", "0.8", lastmod));
    }
  } catch (_) { /* table may not exist */ }

  const xml = wrapUrlset(urls);
  setCache(cacheKey, xml);
  sendXml(res, xml);
}

// ── sitemap-videos.xml: video pages ──────────────────────────────────────────
export function sitemapVideosHandler(_req: Request, res: Response) {
  const cacheKey = "videos";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  const today = new Date().toISOString().split("T")[0];
  const videoEntries = getAllVideoSeoEntries();
  const urls = videoEntries.map(v =>
    buildUrl(`${SITE}/video/${v.youtubeId}`, "monthly", "0.8", today)
  );

  const xml = wrapUrlset(urls);
  setCache(cacheKey, xml);
  sendXml(res, xml);
}

// ── sitemap-listen.xml: audio listen pages ────────────────────────────────────
export async function sitemapListenHandler(_req: Request, res: Response) {
  const cacheKey = "listen";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  try {
    const books = await storage.getAllBooks();
    const today = new Date().toISOString().split("T")[0];
    const urls: string[] = [];

    for (const book of books) {
      for (let ch = 1; ch <= book.chaptersCount; ch++) {
        urls.push(buildUrl(`${SITE}/listen/${encodeURIComponent(book.name)}/${ch}`, "monthly", "0.6", today));
      }
    }

    const xml = wrapUrlset(urls);
    setCache(cacheKey, xml);
    sendXml(res, xml);
  } catch (err) {
    console.error("[sitemap-listen] Error:", err);
    res.status(500).send("Error generating listen sitemap");
  }
}

// ── sitemap-churches.xml: approved church pages ───────────────────────────────
export async function sitemapChurchesHandler(_req: Request, res: Response) {
  const cacheKey = "churches";
  const cached = getCache(cacheKey);
  if (cached) return sendXml(res, cached);

  const today = new Date().toISOString().split("T")[0];
  const urls: string[] = [];
  try {
    const churches = await storage.getApprovedChurches();
    for (const church of churches) {
      urls.push(buildUrl(`${SITE}/church/${church.id}`, "weekly", "0.6", today));
    }
  } catch (_) { /* DB may not be ready */ }

  const xml = wrapUrlset(urls);
  setCache(cacheKey, xml);
  sendXml(res, xml);
}

// ── Legacy: /sitemap.xml now returns the index ────────────────────────────────
export const sitemapHandler = sitemapIndexHandler;

// ── robots.txt ────────────────────────────────────────────────────────────────
export async function robotsHandler(_req: Request, res: Response) {
  const txt = `User-agent: *
Allow: /
Allow: /bible
Allow: /bible/
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
Allow: /orthodox/
Allow: /terms
Allow: /premium
Allow: /church
Allow: /church/
Allow: /challenge

Disallow: /api/
Disallow: /liturgy-control
Disallow: /liturgy-display
Disallow: /admin
Disallow: /highlights
Disallow: /groups
Disallow: /group/
Disallow: /church-request
Disallow: /ministry-auth
Disallow: /share/

Sitemap: ${SITE}/sitemap.xml
`;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(txt);
}

// ── sitemap-news.xml: daily freshness signal for Google News ──────────────────
export function sitemapNewsHandler(_req: Request, res: Response) {
  const today = new Date().toISOString().split("T")[0];
  const month = today.substring(0, 7);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>${SITE}/daily-verse/${today}</loc>
    <news:news>
      <news:publication>
        <news:name>رفيقي — الكتاب المقدس</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${today}</news:publication_date>
      <news:title>آية اليوم — ${today}</news:title>
    </news:news>
  </url>
  <url>
    <loc>${SITE}/orthodox/synaxarium</loc>
    <news:news>
      <news:publication>
        <news:name>رفيقي — السنكسار القبطي</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${today}</news:publication_date>
      <news:title>السنكسار القبطي — ${month}</news:title>
    </news:news>
  </url>
</urlset>`;
  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
}
