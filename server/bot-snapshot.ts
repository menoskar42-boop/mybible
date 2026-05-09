import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { generateFAQSchema, generateBibleChapterTitle, generateBibleBookTitle } from "./seo-title";
import { getInternalLinks, buildInternalLinksHtml } from "./internal-links";
import { extractKeywords } from "./seo-topics";
import { getVideoSeoById } from "./video-seo-data";

const BOT_UA_PATTERN = /Googlebot|bingbot|GPTBot|ClaudeBot|PerplexityBot|Applebot|DuckDuckBot|YandexBot|Baiduspider|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp/i;

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SITE = "https://mybible.oscardevs.com";
const OG_IMAGE = `${SITE}/opengraph.jpg`;
const MAX_CACHE = 400;
const snapshotCache = new Map<string, { html: string; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function evictOldest() {
  if (snapshotCache.size <= MAX_CACHE) return;
  let oldestKey = "";
  let oldestTs = Infinity;
  for (const [k, v] of snapshotCache) {
    if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
  }
  if (oldestKey) snapshotCache.delete(oldestKey);
}

function isBot(ua: string): boolean {
  return BOT_UA_PATTERN.test(ua);
}

function wrapHtml(title: string, description: string, canonical: string, bodyContent: string, schemaJson: object | object[]): string {
  const schemas = Array.isArray(schemaJson) ? schemaJson : [schemaJson];
  const schemaScripts = schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s)}\n</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="الكتاب المقدس رفيقي">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:locale" content="ar_AR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<meta name="robots" content="index, follow">
${schemaScripts}
</head>
<body style="font-family:'Noto Naskh Arabic',serif;max-width:800px;margin:0 auto;padding:20px;direction:rtl;text-align:right;background:#faf8f5;color:#2c1810">
<header>
<nav><a href="/">الرئيسية</a> | <a href="/bible">الكتاب المقدس</a> | <a href="/plans">خطط القراءة</a> | <a href="/emotions">المشاعر</a> | <a href="/kids">الأطفال</a> | <a href="/search">البحث</a></nav>
</header>
<main>
${bodyContent}
</main>
<footer>
<p>&copy; الكتاب المقدس رفيقي - <a href="${SITE}">mybible.oscardevs.com</a></p>
<p><a href="mailto:Contact@oscardevs.com">Contact@oscardevs.com</a></p>
</footer>
</body>
</html>`;
}

function buildChapterSnapshot(bookName: string, chapter: number, verses: Array<{ verse: number; text: string }>, allBooks: Array<{ name: string; chaptersCount: number }>): string {
  const title = generateBibleChapterTitle(bookName, chapter, verses.length);
  const description = `اقرأ ${bookName} الإصحاح ${chapter} كامل (${verses.length} آية) مع إمكانية الاستماع والمشاركة. الكتاب المقدس باللغة العربية.`;
  const canonical = `${SITE}/bible/${encodeURIComponent(bookName)}/${chapter}`;

  const versesHtml = verses.map(v =>
    `<p><strong>${v.verse}</strong> ${esc(v.text)}</p>`
  ).join("\n");

  const relatedLinks: string[] = [];
  const currentBook = allBooks.find(b => b.name === bookName);
  if (currentBook) {
    if (chapter > 1)
      relatedLinks.push(`<a href="/bible/${encodeURIComponent(bookName)}/${chapter - 1}">تفسير ${esc(bookName)} ${chapter - 1}</a>`);
    if (chapter < currentBook.chaptersCount)
      relatedLinks.push(`<a href="/bible/${encodeURIComponent(bookName)}/${chapter + 1}">تفسير ${esc(bookName)} ${chapter + 1}</a>`);
  }
  relatedLinks.push(`<a href="/bible/${encodeURIComponent(bookName)}">تفسير ${esc(bookName)} كامل</a>`);
  const bookIdx = allBooks.findIndex(b => b.name === bookName);
  if (bookIdx > 0)
    relatedLinks.push(`<a href="/bible/${encodeURIComponent(allBooks[bookIdx - 1].name)}">تفسير ${esc(allBooks[bookIdx - 1].name)}</a>`);
  if (bookIdx < allBooks.length - 1)
    relatedLinks.push(`<a href="/bible/${encodeURIComponent(allBooks[bookIdx + 1].name)}">تفسير ${esc(allBooks[bookIdx + 1].name)}</a>`);

  // Contextual internal links for SEO
  const seoLinks = getInternalLinks(`${bookName} ${chapter}`, 4);
  const seoLinksHtml = buildInternalLinksHtml(seoLinks);

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": canonical,
    "inLanguage": "ar",
    "isPartOf": {
      "@type": "Book",
      "name": bookName,
      "inLanguage": "ar",
      "about": "الكتاب المقدس"
    },
    "publisher": {
      "@type": "Organization",
      "name": "الكتاب المقدس رفيقي",
      "url": SITE
    }
  };

  // FAQ schema — uses first 3 verses as answers
  const faqVerses = verses.slice(0, 3).map(v => ({
    bookName,
    chapter,
    verse: v.verse,
    text: v.text,
  }));
  const faqSchema = generateFAQSchema(bookName, faqVerses);
  const schemas: object[] = [webPageSchema];
  if (faqSchema) schemas.push(faqSchema);

  const body = `<h1>تفسير ${esc(bookName)} الإصحاح ${chapter}</h1>
<section>
<p><em>${esc(description)}</em></p>
</section>
<article>
${versesHtml}
</article>
${relatedLinks.length > 0 ? `<nav><h2>أصحاحات ذات صلة</h2><ul>${relatedLinks.map(l => `<li>${l}</li>`).join("")}</ul></nav>` : ""}
<nav aria-label="مواضيع ذات صلة"><h2>مواضيع ذات صلة</h2><p>${seoLinksHtml}</p></nav>`;

  return wrapHtml(title, description, canonical, body, schemas);
}

function buildBookSnapshot(bookName: string, chaptersCount: number, allBooks: Array<{ name: string; chaptersCount: number }>): string {
  const title = generateBibleBookTitle(bookName, chaptersCount);
  const description = `تفسير ${bookName} كامل مع مقدمة عن السفر، قراءة مباشرة، واستماع صوتي لكل إصحاح. يحتوي على ${chaptersCount} إصحاح.`;
  const canonical = `${SITE}/bible/${encodeURIComponent(bookName)}`;

  const chapterLinks = [];
  for (let ch = 1; ch <= chaptersCount; ch++) {
    chapterLinks.push(`<li><a href="/bible/${encodeURIComponent(bookName)}/${ch}">تفسير ${esc(bookName)} الإصحاح ${ch}</a></li>`);
  }

  const adjacentLinks: string[] = [];
  const bookIdx = allBooks.findIndex(b => b.name === bookName);
  if (bookIdx > 0)
    adjacentLinks.push(`<a href="/bible/${encodeURIComponent(allBooks[bookIdx - 1].name)}">تفسير ${esc(allBooks[bookIdx - 1].name)} كامل</a>`);
  if (bookIdx < allBooks.length - 1)
    adjacentLinks.push(`<a href="/bible/${encodeURIComponent(allBooks[bookIdx + 1].name)}">تفسير ${esc(allBooks[bookIdx + 1].name)} كامل</a>`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": bookName,
    "inLanguage": "ar",
    "about": "الكتاب المقدس",
    "numberOfPages": chaptersCount,
    "url": canonical,
    "publisher": {
      "@type": "Organization",
      "name": "الكتاب المقدس رفيقي",
      "url": SITE
    }
  };

  const body = `<h1>تفسير ${esc(bookName)} كامل</h1>
<section>
<p><em>${esc(description)}</em></p>
</section>
<nav>
<h2>الإصحاحات</h2>
<ul>${chapterLinks.join("\n")}</ul>
</nav>
${adjacentLinks.length > 0 ? `<nav><h2>أسفار ذات صلة</h2><ul>${adjacentLinks.map(l => `<li>${l}</li>`).join("")}</ul></nav>` : ""}`;

  return wrapHtml(title, description, canonical, body, schema);
}

function buildStaticPageSnapshot(path: string): string | null {
  const pages: Record<string, { title: string; desc: string; schema: object }> = {
    "/": {
      title: "الكتاب المقدس رفيقي | قراءة يومية، تفسير، خطط روحية",
      desc: "موقع الكتاب المقدس العربي للقراءة اليومية مع التفسير، خطط القراءة، آيات حسب المشاعر، وقسم قصص الأطفال. رفيقك الروحي اليومي.",
      schema: { "@context": "https://schema.org", "@type": "WebApplication", "name": "الكتاب المقدس رفيقي", "applicationCategory": "ReligiousApplication", "operatingSystem": "Web", "inLanguage": "ar", "url": SITE }
    },
    "/bible": {
      title: "الكتاب المقدس كاملاً بالعربية | العهد القديم والجديد مع التفسير",
      desc: "اقرأ الكتاب المقدس كاملاً باللغة العربية مع تفسير لكل آية. 66 سفراً من العهد القديم والجديد.",
      schema: { "@context": "https://schema.org", "@type": "Book", "name": "الكتاب المقدس", "inLanguage": "ar", "bookFormat": "https://schema.org/EBook", "numberOfPages": 1189, "genre": "Religious text" }
    },
    "/plans": {
      title: "خطط قراءة الكتاب المقدس | 30 إلى 730 يوم",
      desc: "خطط قراءة منظمة للكتاب المقدس: 30، 60، 90، 180، 365، و730 يوم. ابدأ رحلتك الروحية اليوم.",
      schema: { "@context": "https://schema.org", "@type": "HowTo", "name": "خطط قراءة الكتاب المقدس", "inLanguage": "ar" }
    },
    "/emotions": {
      title: "آيات حسب المشاعر | التغذية الروحية | الكتاب المقدس رفيقي",
      desc: "اعثر على آيات الكتاب المقدس المناسبة لمشاعرك: الفرح، الحزن، القلق، الخوف، الأمل، والمزيد.",
      schema: { "@context": "https://schema.org", "@type": "Article", "headline": "التغذية الروحية من الكتاب المقدس", "inLanguage": "ar" }
    },
    "/kids": {
      title: "قصص الكتاب المقدس للأطفال | فيديوهات وقصص مسيحية",
      desc: "قصص الكتاب المقدس المصورة للأطفال مع فيديوهات تعليمية. محتوى آمن ومناسب للأعمار الصغيرة.",
      schema: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "قصص الكتاب المقدس للأطفال", "inLanguage": "ar" }
    },
    "/search": {
      title: "البحث في الكتاب المقدس | بحث ذكي في أكثر من 31,000 آية",
      desc: "ابحث في نصوص الكتاب المقدس كاملة. بحث ذكي في أكثر من 31,000 آية باللغة العربية.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "البحث في الكتاب المقدس", "inLanguage": "ar" }
    },
    "/about": {
      title: "عن الموقع | الكتاب المقدس رفيقي",
      desc: "تعرف على موقع الكتاب المقدس رفيقي - رفيقك الروحي اليومي للقراءة والتأمل في كلمة الله.",
      schema: { "@context": "https://schema.org", "@type": "AboutPage", "name": "عن الكتاب المقدس رفيقي", "inLanguage": "ar" }
    },
    "/contact": {
      title: "اتصل بنا | الكتاب المقدس رفيقي",
      desc: "تواصل معنا عبر البريد الإلكتروني Contact@oscardevs.com أو من خلال نموذج الاتصال.",
      schema: { "@context": "https://schema.org", "@type": "ContactPage", "name": "اتصل بنا", "inLanguage": "ar" }
    },
    "/privacy": {
      title: "سياسة الخصوصية | الكتاب المقدس رفيقي",
      desc: "سياسة الخصوصية لموقع الكتاب المقدس رفيقي. تعرّف على كيفية حماية بياناتك.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "سياسة الخصوصية", "inLanguage": "ar" }
    },
    "/orthodox": {
      title: "أرثوذوكسيات | سنكسار، أجبية، خولاجي المقدس، ألحان قبطية، قطمارس، سير القديسين والشهداء الأقباط",
      desc: "قسم أرثوذوكسيات الشامل: سنكسار اليوم، كتاب الأجبية وساعات الصلاة السبع، الخولاجي المقدس (قداس باسيليوس وغريغوريوس وكيرلس)، كتب الألحان القبطية والإبصلمودية، القطمارس والقراءات اليومية، مردات الشماس القبطية، وسير القديسين والشهداء الأقباط الأرثوذكس وفيديوهاتهم.",
      schema: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "أرثوذوكسيات — الكتاب المقدس رفيقي",
        "description": "سنكسار اليوم، كتاب الأجبية، الخولاجي المقدس، كتب الألحان القبطية والإبصلمودية، القطمارس، مردات الشماس، وسير القديسين والشهداء الأقباط الأرثوذكس.",
        "inLanguage": "ar",
        "about": { "@type": "Thing", "name": "الكنيسة القبطية الأرثوذكسية" },
        "keywords": "الأجبية القبطية، خولاجي مقدس، قداس باسيليوس، قداس غريغوريوس، قداس كيرلس، الإبصلمودية، تسبحة قبطية، القطمارس، مردات الشماس، كيرياليسون، سير القديسين الأقباط، شهداء ليبيا",
        "url": "https://mybible.oscardevs.com/orthodox"
      }
    }
  };

  const page = pages[path];
  if (!page) return null;

  const canonical = `${SITE}${path === '/' ? '' : path}`;
  const body = `<h1>${page.title.split('|')[0].trim()}</h1>
<p>${page.desc}</p>`;

  return wrapHtml(page.title, page.desc, canonical, body, page.schema);
}

let cachedBooks: Array<{ id: number; name: string; chaptersCount: number }> | null = null;

async function ensureBooks() {
  if (!cachedBooks) {
    cachedBooks = (await storage.getAllBooks()).map(b => ({
      id: b.id,
      name: b.name,
      chaptersCount: b.chaptersCount
    }));
  }
  return cachedBooks;
}

function serveCached(res: Response, cacheKey: string): boolean {
  const cached = snapshotCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("X-Bot-Snapshot", "cached");
    res.send(cached.html);
    return true;
  }
  return false;
}

function cacheAndServe(res: Response, cacheKey: string, html: string) {
  snapshotCache.set(cacheKey, { html, ts: Date.now() });
  evictOldest();
  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("X-Bot-Snapshot", "fresh");
  res.send(html);
}

export async function botSnapshotMiddleware(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"] || "";
  if (!isBot(ua)) return next();

  const path = req.path;
  const bookParam = req.query.book as string | undefined;
  const chapterParam = req.query.chapter as string | undefined;

  // ── Path-based: /bible/:book/:chapter ────────────────────────────────────
  const bibleChapterPath = path.match(/^\/bible\/([^/]+)\/(\d+)$/);
  if (bibleChapterPath) {
    try {
      const bookName = decodeURIComponent(bibleChapterPath[1]);
      const chapter = parseInt(bibleChapterPath[2], 10);
      const books = await ensureBooks();
      const book = books.find(b => b.name === bookName);
      if (!book || isNaN(chapter) || chapter < 1 || chapter > book.chaptersCount) return next();

      const cacheKey = `ch:${bookName}:${chapter}`;
      if (serveCached(res, cacheKey)) return;

      const verses = await storage.getVersesByBook(book.id, chapter);
      if (!verses || verses.length === 0) return next();

      const html = buildChapterSnapshot(
        book.name, chapter,
        verses.map(v => ({ verse: v.verse, text: v.text })),
        books
      );
      return cacheAndServe(res, cacheKey, html);
    } catch (err) {
      console.error("[bot-snapshot] Error:", err);
      return next();
    }
  }

  // ── Path-based: /bible/:book ──────────────────────────────────────────────
  const bibleBookPath = path.match(/^\/bible\/([^/]+)$/);
  if (bibleBookPath) {
    try {
      const bookName = decodeURIComponent(bibleBookPath[1]);
      const books = await ensureBooks();
      const book = books.find(b => b.name === bookName);
      if (!book) return next();

      const cacheKey = `bk:${bookName}`;
      if (serveCached(res, cacheKey)) return;

      const html = buildBookSnapshot(book.name, book.chaptersCount, books);
      return cacheAndServe(res, cacheKey, html);
    } catch (err) {
      console.error("[bot-snapshot] Error:", err);
      return next();
    }
  }

  // ── Legacy query-string: /bible?book=X&chapter=Y (redirect bots to path-based) ──
  if (path === "/bible" && bookParam) {
    try {
      const books = await ensureBooks();
      const book = books.find(b => b.name === bookParam);
      if (!book) return next();

      if (chapterParam) {
        const chapter = parseInt(chapterParam, 10);
        if (isNaN(chapter) || chapter < 1 || chapter > book.chaptersCount) return next();
        return res.redirect(301, `/bible/${encodeURIComponent(book.name)}/${chapter}`);
      } else {
        return res.redirect(301, `/bible/${encodeURIComponent(book.name)}`);
      }
    } catch (err) {
      console.error("[bot-snapshot] Error:", err);
      return next();
    }
  }

  // ── Topic pages: /topics/:slug ────────────────────────────────────────
  const topicMatch = path.match(/^\/topics\/([^/]+)$/);
  if (topicMatch) {
    const slug = topicMatch[1];
    try {
      const cacheKey = `tp:${slug}`;
      if (serveCached(res, cacheKey)) return;

      const topic = await storage.getSeoTopicBySlug(slug);
      if (!topic) return next();

      // Fetch verses via keyword matching
      const allVerses = await Promise.all(
        topic.keywords.slice(0, 3).map(kw => storage.smartSearchVerses(kw, 6))
      );
      const seen = new Set<number>();
      const verses = allVerses.flat()
        .filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; })
        .slice(0, 15);

      const canonical = `${SITE}/topics/${slug}`;
      const title = `آيات الكتاب المقدس عن ${topic.title} | الكتاب المقدس رفيقي`;
      const description = `مجموعة آيات من الكتاب المقدس عن ${topic.title}. ${verses.length} آية مختارة تتحدث عن ${topic.keywords.slice(0, 3).join('، ')}.`;

      const versesHtml = verses.map((v, i) =>
        `<li><strong>${esc((v as any).bookName || '')} ${v.chapter}:${v.verse}</strong> — ${esc(v.text.substring(0, 200))}</li>`
      ).join('\n');

      const internalLinks = getInternalLinks(topic.title, 5);
      const internalLinksHtml = buildInternalLinksHtml(internalLinks);

      const relatedTopics = await storage.getSimilarTopics(slug, topic.keywords, 5);
      const relatedLinksHtml = relatedTopics.length > 0
        ? relatedTopics.map(r => `<a href="${SITE}/topics/${r.slug}">${esc(r.title)}</a>`).join(' | ')
        : '';

      const webPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url: canonical,
        inLanguage: 'ar',
        about: { '@type': 'Thing', name: topic.title },
        publisher: { '@type': 'Organization', name: 'الكتاب المقدس رفيقي', url: SITE },
      };

      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `آيات عن ${topic.title}`,
        description,
        numberOfItems: verses.length,
        itemListElement: verses.slice(0, 10).map((v, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${(v as any).bookName || ''} ${v.chapter}:${v.verse}`,
          description: v.text.substring(0, 150),
        })),
      };

      const body = `
<nav aria-label="breadcrumb">
  <a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/search">البحث</a> &rsaquo; ${esc(topic.title)}
</nav>
<h1>آيات الكتاب المقدس عن ${esc(topic.title)}</h1>
<p><em>مجموعة آيات من الكتاب المقدس عن ${esc(topic.title)}. ${esc(description)}</em></p>
<section>
  <h2>الكلمات المفتاحية</h2>
  <p>${topic.keywords.map(k => esc(k)).join(' · ')}</p>
</section>
<article>
  <h2>الآيات (${verses.length})</h2>
  <ol>${versesHtml}</ol>
</article>
${relatedLinksHtml ? `<nav aria-label="مواضيع ذات صلة"><h2>مواضيع ذات صلة</h2><p>${relatedLinksHtml}</p></nav>` : ''}
<nav aria-label="روابط داخلية"><h2>روابط ذات صلة</h2><p>${internalLinksHtml}</p></nav>
<p><a href="${SITE}/search?q=${encodeURIComponent(topic.title)}">بحث أعمق عن "${esc(topic.title)}"</a></p>`;

      const html = wrapHtml(title, description, canonical, body, [webPageSchema, itemListSchema]);
      storage.incrementTopicVisit(slug).catch(() => {});
      return cacheAndServe(res, cacheKey, html);
    } catch (err) {
      console.error('[bot-snapshot] Topic error:', err);
      return next();
    }
  }

  // ── Video pages: /video/:youtubeId ───────────────────────────────────────
  const videoMatch = path.match(/^\/video\/([A-Za-z0-9_\-]+)$/);
  if (videoMatch) {
    const youtubeId = videoMatch[1];
    const cacheKey = `vid:${youtubeId}`;
    if (serveCached(res, cacheKey)) return;

    const v = getVideoSeoById(youtubeId);
    const canonical = `${SITE}/video/${youtubeId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;

    const chapterLink = v.book && v.chapter
      ? `<p><a href="${SITE}/bible?book=${encodeURIComponent(v.book)}&chapter=${v.chapter}">📖 اقرأ ${esc(v.book)} الإصحاح ${v.chapter}</a></p>`
      : "";
    const bookLink = v.book
      ? `<p><a href="${SITE}/bible?book=${encodeURIComponent(v.book)}">📚 تفسير ${esc(v.book)} كامل</a></p>`
      : "";

    const relatedLinks = getInternalLinks(v.title, 4);
    const relatedLinksHtml = buildInternalLinksHtml(relatedLinks);

    const videoSchema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": v.title,
      "description": v.description,
      "thumbnailUrl": thumbnailUrl,
      "embedUrl": embedUrl,
      "uploadDate": new Date().toISOString().split("T")[0],
      "inLanguage": "ar",
      "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE },
      ...(v.book && v.chapter ? {
        "about": {
          "@type": "Book",
          "name": v.book,
          "inLanguage": "ar"
        }
      } : {})
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE },
        { "@type": "ListItem", "position": 2, "name": "الكتاب المقدس", "item": `${SITE}/bible` },
        ...(v.book ? [{ "@type": "ListItem", "position": 3, "name": esc(v.title), "item": canonical }] : []),
      ]
    };

    const body = `
<nav aria-label="breadcrumb">
  <a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/bible">الكتاب المقدس</a>${v.book ? ` &rsaquo; <a href="${SITE}/bible?book=${encodeURIComponent(v.book)}">${esc(v.book)}</a>` : ""}
</nav>
<h1>${esc(v.title)}</h1>
<p><em>${esc(v.description)}</em></p>
<figure>
  <img src="${thumbnailUrl}" alt="${esc(v.title)}" width="640" height="360" loading="lazy">
  <figcaption>${esc(v.title)}</figcaption>
</figure>
<section>
  <h2>مشاهدة الفيديو</h2>
  <p><a href="https://www.youtube.com/watch?v=${youtubeId}" rel="noopener noreferrer" target="_blank">مشاهدة على YouTube &#8599;</a></p>
  <p><a href="${SITE}/video/${youtubeId}">مشاهدة على موقعنا</a></p>
</section>
<section>
  <h2>الكلمات المفتاحية</h2>
  <p>${v.keywords.map(k => esc(k)).join(" · ")}</p>
</section>
<nav>
${chapterLink}
${bookLink}
<p><a href="${SITE}/bible">📖 الكتاب المقدس كاملاً</a></p>
<p><a href="${SITE}/plans">📅 خطط القراءة</a></p>
</nav>
<nav aria-label="مواضيع ذات صلة"><h2>روابط ذات صلة</h2><p>${relatedLinksHtml}</p></nav>`;

    const html = wrapHtml(v.title, v.description, canonical, body, [videoSchema, breadcrumb]);
    return cacheAndServe(res, cacheKey, html);
  }

  // ── Emotions type pages: /emotions/:type ─────────────────────────────────
  const emotionMatch = path.match(/^\/emotions\/([^/]+)$/);
  if (emotionMatch) {
    const emotionType = decodeURIComponent(emotionMatch[1]);
    const cacheKey = `em:${emotionType}`;
    if (serveCached(res, cacheKey)) return;

    const canonical = `${SITE}/emotions/${encodeURIComponent(emotionType)}`;
    const title = `آيات الكتاب المقدس عن ${emotionType} | تغذية روحية | الكتاب المقدس رفيقي`;
    const description = `اعثر على آيات الكتاب المقدس التي تتحدث عن ${emotionType}. آيات مختارة تمنحك الدعم والتشجيع الروحي.`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "url": canonical,
      "inLanguage": "ar",
      "about": { "@type": "Thing", "name": emotionType },
      "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
    };

    const body = `
<nav aria-label="breadcrumb">
  <a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/emotions">التغذية الروحية</a> &rsaquo; ${esc(emotionType)}
</nav>
<h1>آيات الكتاب المقدس عن ${esc(emotionType)}</h1>
<p><em>${esc(description)}</em></p>
<p>يساعدك موقع الكتاب المقدس رفيقي على إيجاد الآيات المناسبة لمشاعرك. اكتشف ما يقوله الكتاب المقدس عن ${esc(emotionType)}.</p>
<nav>
  <h2>استكشف المزيد</h2>
  <ul>
    <li><a href="${SITE}/emotions">جميع المشاعر والتغذية الروحية</a></li>
    <li><a href="${SITE}/bible">قراءة الكتاب المقدس</a></li>
    <li><a href="${SITE}/search?q=${encodeURIComponent(emotionType)}">البحث عن "${esc(emotionType)}"</a></li>
    <li><a href="${SITE}/plans">خطط القراءة اليومية</a></li>
  </ul>
</nav>`;

    const html = wrapHtml(title, description, canonical, body, schema);
    return cacheAndServe(res, cacheKey, html);
  }

  // ── Audio/listen pages: /listen/:book/:chapter ───────────────────────────
  const listenMatch = path.match(/^\/listen\/([^/]+)\/(\d+)$/);
  if (listenMatch) {
    const bookName = decodeURIComponent(listenMatch[1]);
    const chapter = parseInt(listenMatch[2], 10);
    if (!isNaN(chapter) && chapter > 0) {
      const cacheKey = `li:${bookName}:${chapter}`;
      if (serveCached(res, cacheKey)) return;

      const canonical = `${SITE}/listen/${encodeURIComponent(bookName)}/${chapter}`;
      const title = `استماع ${bookName} الإصحاح ${chapter} | الكتاب المقدس الصوتي`;
      const description = `استمع لسفر ${bookName} الإصحاح ${chapter} صوتياً. قراءة صوتية للكتاب المقدس باللغة العربية.`;

      const schema = {
        "@context": "https://schema.org",
        "@type": "AudioObject",
        "name": title,
        "description": description,
        "inLanguage": "ar",
        "url": canonical,
        "about": { "@type": "Book", "name": bookName, "inLanguage": "ar" }
      };

      const body = `
<nav aria-label="breadcrumb">
  <a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/bible/${encodeURIComponent(bookName)}">${esc(bookName)}</a> &rsaquo; استماع الإصحاح ${chapter}
</nav>
<h1>${esc(title)}</h1>
<p><em>${esc(description)}</em></p>
<nav>
  <ul>
    <li><a href="${SITE}/bible/${encodeURIComponent(bookName)}/${chapter}">📖 قراءة ${esc(bookName)} ${chapter}</a></li>
    <li><a href="${SITE}/bible/${encodeURIComponent(bookName)}">📚 جميع إصحاحات ${esc(bookName)}</a></li>
    ${chapter > 1 ? `<li><a href="${SITE}/listen/${encodeURIComponent(bookName)}/${chapter - 1}">🔊 الإصحاح ${chapter - 1}</a></li>` : ""}
    <li><a href="${SITE}/listen/${encodeURIComponent(bookName)}/${chapter + 1}">🔊 الإصحاح ${chapter + 1}</a></li>
  </ul>
</nav>`;

      const html = wrapHtml(title, description, canonical, body, schema);
      return cacheAndServe(res, cacheKey, html);
    }
  }

  // ── Kids story pages: /kids/story/:id ────────────────────────────────────
  const kidsStoryMatch = path.match(/^\/kids\/story\/(\d+)$/);
  if (kidsStoryMatch) {
    const storyId = parseInt(kidsStoryMatch[1], 10);
    const cacheKey = `ks:${storyId}`;
    if (serveCached(res, cacheKey)) return;

    const canonical = `${SITE}/kids/story/${storyId}`;
    const title = `قصة الكتاب المقدس للأطفال رقم ${storyId} | قصص مسيحية للأطفال`;
    const description = `قصة مسيحية مصورة للأطفال من الكتاب المقدس. محتوى تعليمي ديني آمن ومناسب للأطفال.`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "name": title,
      "description": description,
      "url": canonical,
      "inLanguage": "ar",
      "audience": { "@type": "PeopleAudience", "suggestedMinAge": 4, "suggestedMaxAge": 12 },
      "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
    };

    const body = `
<nav aria-label="breadcrumb">
  <a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/kids">الأطفال</a> &rsaquo; <a href="${SITE}/kids/stories">القصص</a> &rsaquo; القصة ${storyId}
</nav>
<h1>${esc(title)}</h1>
<p><em>${esc(description)}</em></p>
<nav>
  <ul>
    <li><a href="${SITE}/kids">قسم الأطفال</a></li>
    <li><a href="${SITE}/kids/stories">جميع القصص المصورة</a></li>
    ${storyId > 1 ? `<li><a href="${SITE}/kids/story/${storyId - 1}">القصة السابقة</a></li>` : ""}
    <li><a href="${SITE}/kids/story/${storyId + 1}">القصة التالية</a></li>
  </ul>
</nav>`;

    const html = wrapHtml(title, description, canonical, body, schema);
    return cacheAndServe(res, cacheKey, html);
  }

  // ── Daily verse pages: /daily-verse and /daily-verse/:date ───────────────
  if (path === "/daily-verse" || path.match(/^\/daily-verse\/\d{4}-\d{2}-\d{2}$/)) {
    const cacheKey = `dv:${path}`;
    if (serveCached(res, cacheKey)) return;

    const isArchive = path !== "/daily-verse";
    const dateStr = isArchive ? path.split("/").pop()! : new Date().toISOString().split("T")[0];
    const canonical = `${SITE}${path}`;
    const title = `آية اليوم ${isArchive ? dateStr : ""} | الكتاب المقدس رفيقي`.trim();
    const description = `آية يومية من الكتاب المقدس${isArchive ? ` بتاريخ ${dateStr}` : ""}. تأمل يومي روحي مع الكتاب المقدس رفيقي.`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "url": canonical,
      "inLanguage": "ar",
      "datePublished": dateStr,
      "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
    };

    const body = `
<h1>${esc(title)}</h1>
<p><em>${esc(description)}</em></p>
<nav>
  <ul>
    <li><a href="${SITE}/daily-verse">آية اليوم</a></li>
    <li><a href="${SITE}/bible">قراءة الكتاب المقدس</a></li>
    <li><a href="${SITE}/emotions">التغذية الروحية</a></li>
  </ul>
</nav>`;

    const html = wrapHtml(title, description, canonical, body, schema);
    return cacheAndServe(res, cacheKey, html);
  }

  const staticSnapshot = buildStaticPageSnapshot(path);
  if (staticSnapshot) {
    const cacheKey = `st:${path}`;
    if (serveCached(res, cacheKey)) return;
    return cacheAndServe(res, cacheKey, staticSnapshot);
  }

  next();
}
