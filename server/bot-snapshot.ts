import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { generateFAQSchema, generateBibleChapterTitle, generateBibleBookTitle } from "./seo-title";
import { getInternalLinks, buildInternalLinksHtml } from "./internal-links";
import { extractKeywords } from "./seo-topics";
import { liturgies } from "../client/src/lib/liturgy-content";
import { getVideoSeoById } from "./video-seo-data";
import { agpeyaHoursFull, commonOpeningPrayers } from "../client/src/lib/agpeya-content";
import { synaxariumMonths, getMonthById, getDayEntries, entryTypeIcon } from "../client/src/lib/synaxarium-content";
import { buildChapterOgUrl, buildBookOgUrl, buildOrthodoxOgUrl } from "./og-image";

const BOT_UA_PATTERN = /Googlebot|Googlebot-Image|Googlebot-Video|Google-InspectionTool|bingbot|BingPreview|GPTBot|ClaudeBot|PerplexityBot|Applebot|DuckDuckBot|YandexBot|Baiduspider|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|AdsBot-Google|Mediapartners-Google|APIs-Google/i;

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

function buildFaqSchema(faqs: { q: string; a: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };
}

function wrapHtml(title: string, description: string, canonical: string, bodyContent: string, schemaJson: object | object[], ogImage?: string): string {
  const today = new Date().toISOString().split('T')[0];
  const rawSchemas = Array.isArray(schemaJson) ? schemaJson : [schemaJson];
  const schemas = rawSchemas.map((s: Record<string, unknown>) =>
    s["dateModified"] === undefined ? { ...s, dateModified: today } : s
  );
  const schemaScripts = schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s)}\n</script>`)
    .join('\n');
  const img = ogImage || OG_IMAGE;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://www.youtube.com">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="الكتاب المقدس رفيقي">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ar_AR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${img}">
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

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE },
      { "@type": "ListItem", "position": 2, "name": "الكتاب المقدس", "item": `${SITE}/bible` },
      { "@type": "ListItem", "position": 3, "name": bookName, "item": `${SITE}/bible/${encodeURIComponent(bookName)}` },
      { "@type": "ListItem", "position": 4, "name": `الإصحاح ${chapter}`, "item": canonical }
    ]
  };

  // FAQ schema — uses first 3 verses as answers
  const faqVerses = verses.slice(0, 3).map(v => ({
    bookName,
    chapter,
    verse: v.verse,
    text: v.text,
  }));
  const faqSchema = generateFAQSchema(bookName, faqVerses);
  const schemas: object[] = [webPageSchema, breadcrumbSchema];
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

  return wrapHtml(title, description, canonical, body, schemas, buildChapterOgUrl(bookName, chapter));
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

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Book",
      "name": bookName,
      "inLanguage": "ar",
      "about": "الكتاب المقدس",
      "numberOfPages": chaptersCount,
      "url": canonical,
      "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE },
        { "@type": "ListItem", "position": 2, "name": "الكتاب المقدس", "item": `${SITE}/bible` },
        { "@type": "ListItem", "position": 3, "name": bookName, "item": canonical }
      ]
    }
  ];

  const body = `<h1>تفسير ${esc(bookName)} كامل</h1>
<section>
<p><em>${esc(description)}</em></p>
</section>
<nav>
<h2>الإصحاحات</h2>
<ul>${chapterLinks.join("\n")}</ul>
</nav>
${adjacentLinks.length > 0 ? `<nav><h2>أسفار ذات صلة</h2><ul>${adjacentLinks.map(l => `<li>${l}</li>`).join("")}</ul></nav>` : ""}`;

  return wrapHtml(title, description, canonical, body, schema, buildBookOgUrl(bookName, chaptersCount));
}

function buildStaticPageSnapshot(path: string): string | null {
  const pages: Record<string, { title: string; desc: string; schema: object | object[] }> = {
    "/": {
      title: "الكتاب المقدس رفيقي | قراءة يومية، تفسير، خطط روحية",
      desc: "موقع الكتاب المقدس العربي للقراءة اليومية مع التفسير، خطط القراءة، آيات حسب المشاعر، وقسم قصص الأطفال. رفيقك الروحي اليومي.",
      schema: [
        { "@context": "https://schema.org", "@type": "WebApplication", "name": "الكتاب المقدس رفيقي", "applicationCategory": "ReligiousApplication", "operatingSystem": "Web", "inLanguage": "ar", "url": SITE },
        { "@context": "https://schema.org", "@type": "WebSite", "name": "الكتاب المقدس رفيقي", "url": SITE, "potentialAction": { "@type": "SearchAction", "target": { "@type": "EntryPoint", "urlTemplate": `${SITE}/search?q={search_term_string}` }, "query-input": "required name=search_term_string" } }
      ]
    },
    "/bible": {
      title: "الكتاب المقدس كاملاً بالعربية | العهد القديم والجديد مع التفسير",
      desc: "اقرأ الكتاب المقدس كاملاً باللغة العربية مع تفسير لكل آية. 66 سفراً من العهد القديم والجديد.",
      schema: [
        { "@context": "https://schema.org", "@type": "Book", "name": "الكتاب المقدس", "inLanguage": "ar", "bookFormat": "https://schema.org/EBook", "numberOfPages": 1189, "genre": "Religious text" },
        buildFaqSchema([
          { q: "كم عدد أسفار الكتاب المقدس؟", a: "يتكون الكتاب المقدس من 66 سفراً: 39 سفراً في العهد القديم و27 سفراً في العهد الجديد. تضيف الكنيسة القبطية الأرثوذكسية 7 أسفار ديوتيروكانونية." },
          { q: "ما هي الترجمة العربية المعتمدة للكتاب المقدس؟", a: "تعتمد الكنيسة القبطية الأرثوذكسية الترجمة العربية الكاثوليكية المشتركة وكذلك ترجمة فانديك الكلاسيكية." },
          { q: "كيف أقرأ الكتاب المقدس يومياً؟", a: "يمكنك متابعة خطط القراءة اليومية على منصة رفيقي: 30، 60، 90، 180، 365، أو 730 يوماً لقراءة الكتاب المقدس كاملاً." },
          { q: "ما الفرق بين العهد القديم والجديد؟", a: "العهد القديم يتناول تاريخ شعب إسرائيل والنبوءات، أما العهد الجديد فيتحدث عن حياة يسوع المسيح وتعاليمه ورسائل الرسل." }
        ])
      ]
    },
    "/plans": {
      title: "خطط قراءة الكتاب المقدس | 30 إلى 730 يوم",
      desc: "خطط قراءة منظمة للكتاب المقدس: 30، 60، 90، 180، 365، و730 يوم. ابدأ رحلتك الروحية اليوم.",
      schema: [
        { "@context": "https://schema.org", "@type": "HowTo", "name": "كيف تقرأ الكتاب المقدس كاملاً", "inLanguage": "ar",
          "step": [
            { "@type": "HowToStep", "name": "اختر خطة قراءة", "text": "حدد المدة الزمنية المناسبة: 30 أو 60 أو 90 أو 180 أو 365 أو 730 يوم" },
            { "@type": "HowToStep", "name": "اقرأ يومياً", "text": "التزم بقراءة الإصحاحات المقررة يومياً وفق الخطة التي اخترتها" },
            { "@type": "HowToStep", "name": "تابع تقدمك", "text": "تتبع تقدمك في القراءة وشاهد نسبة اكتمالك للكتاب المقدس" }
          ]
        },
        buildFaqSchema([
          { q: "كم يستغرق قراءة الكتاب المقدس كاملاً؟", a: "يمكن قراءة الكتاب المقدس كاملاً في سنة إذا قرأت 3-4 إصحاحات يومياً. منصة رفيقي توفر خططاً من 30 يوم حتى 730 يوم حسب سرعتك." },
          { q: "من أين أبدأ قراءة الكتاب المقدس؟", a: "يُنصح المبتدئون بالبدء بإنجيل يوحنا، ثم العهد الجديد كاملاً، ثم العودة للعهد القديم. أو يمكن البدء من سفر التكوين بالترتيب." }
        ])
      ]
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
      schema: [
        { "@context": "https://schema.org", "@type": "WebPage", "name": "البحث في الكتاب المقدس", "inLanguage": "ar" },
        { "@context": "https://schema.org", "@type": "WebSite", "name": "الكتاب المقدس رفيقي", "url": SITE,
          "potentialAction": { "@type": "SearchAction", "target": { "@type": "EntryPoint", "urlTemplate": `${SITE}/search?q={search_term_string}` }, "query-input": "required name=search_term_string" }
        }
      ]
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
    },
    "/orthodox/kholagy": {
      title: "الخولاجي المقدس | قداس باسيليوس وغريغوريوس وكيرلس | أرثوذوكسيات",
      desc: "اقرأ نصوص القداسات القبطية الأرثوذكسية الثلاثة: قداس القديس باسيليوس وغريغوريوس وكيرلس بالعربية والقبطية.",
      schema: [
        { "@context": "https://schema.org", "@type": "CollectionPage", "name": "الخولاجي المقدس", "inLanguage": "ar", "url": `${SITE}/orthodox/kholagy` },
        buildFaqSchema([
          { q: "ما هو الخولاجي المقدس؟", a: "الخولاجي المقدس هو كتاب القداسات الليتورجية في الكنيسة القبطية الأرثوذكسية، ويتضمن نصوص ثلاث قداسات: قداس القديس باسيليوس الكبير، وقداس القديس غريغوريوس اللاهوتي، وقداس القديس كيرلس." },
          { q: "كم عدد القداسات في الكنيسة القبطية الأرثوذكسية؟", a: "تحتفل الكنيسة القبطية الأرثوذكسية بثلاث قداسات: قداس القديس باسيليوس (الأكثر استخداماً)، قداس القديس غريغوريوس (في الأعياد الكبرى)، وقداس القديس كيرلس (قداس مارك)." },
          { q: "ما الفرق بين قداس باسيليوس وقداس غريغوريوس؟", a: "قداس باسيليوس هو القداس الاعتيادي ويُقام أسبوعياً. أما قداس غريغوريوس فيُقام في الأعياد الكبرى كالميلاد والقيامة وله طابع احتفالي وصلواته أكثر تفصيلاً." },
          { q: "هل يمكن قراءة الخولاجي بالعربية والقبطية معاً؟", a: "نعم، منصة رفيقي تعرض نصوص الخولاجي بالعربية والقبطية جنباً إلى جنب في نظام عرض ثنائي اللغة مخصص لقداسات الكنيسة." }
        ])
      ]
    },
    "/orthodox/deacon": {
      title: "مردات الشماس | كيرياليسون، مرد الاعتراف، مردات القداس | أرثوذوكسيات",
      desc: "مردات الشماس الكاملة في الكنيسة القبطية الأرثوذكسية: كيرياليسون، مرد الاعتراف، مردات رفع البخور، ومردات القداس الإلهي بالعربي والقبطي.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "مردات الشماس القبطية", "inLanguage": "ar" }
    },
    "/orthodox/hymns": {
      title: "الألحان القبطية والإبصلمودية | تسبحة قبطية كاملة | أرثوذوكسيات",
      desc: "كتب الألحان القبطية والإبصلمودية الكاملة: ألحان القداس، ألحان الأسبوع، تسبحة نصف الليل، إبصلمودية كيهك، وألحان الأعياد القبطية الكبرى.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "الألحان القبطية والإبصلمودية", "inLanguage": "ar" }
    },
    "/orthodox/katameros": {
      title: "القطمارس | القراءات الليتورجية اليومية | أرثوذوكسيات قبطية",
      desc: "القطمارس القبطي الكامل: القراءات الليتورجية اليومية للقداس، البولس، الكاثوليكون، الإبركسيس، المزامير، والإنجيل لكل أيام السنة القبطية.",
      schema: [
        { "@context": "https://schema.org", "@type": "WebPage", "name": "القطمارس القبطي", "inLanguage": "ar" },
        buildFaqSchema([
          { q: "ما هو القطمارس؟", a: "القطمارس (أو الكتاب المقدس المرتَّب) هو الكتاب الليتورجي القبطي الذي يحتوي على القراءات اليومية المقررة للقداس الإلهي: رسالة بولس، الكاثوليكون، الإبركسيس، المزامير، والإنجيل لكل يوم في السنة القبطية." },
          { q: "كيف يختلف القطمارس عن الكتاب المقدس العادي؟", a: "القطمارس يرتب نفس نصوص الكتاب المقدس وفق التقويم القبطي الليتورجي، حيث تُقرأ أجزاء محددة في أيام وأعياد بعينها طوال السنة." }
        ])
      ]
    },
    "/orthodox/saints": {
      title: "سير القديسين والشهداء الأقباط | فيديوهات وقصص | أرثوذوكسيات",
      desc: "سير القديسين والشهداء الأقباط الأرثوذكس: قصص الآباء الرسوليين، الشهداء، النساك، البطاركة، الرهبان والقديسين العظام في الكنيسة القبطية.",
      schema: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "سير القديسين الأقباط", "inLanguage": "ar" }
    },
    "/orthodox/creed": {
      title: "العقيدة القبطية الأرثوذكسية | قانون الإيمان النيقاوي | أرثوذوكسيات",
      desc: "العقيدة القبطية الأرثوذكسية الكاملة: قانون الإيمان النيقاوي، الأسرار السبعة، التعاليم اللاهوتية الجوهرية للكنيسة القبطية الأرثوذكسية.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "العقيدة القبطية الأرثوذكسية", "inLanguage": "ar" }
    },
    "/orthodox/history": {
      title: "تاريخ الكنيسة القبطية الأرثوذكسية | البطاركة والمجامع المسكونية | أرثوذوكسيات",
      desc: "تاريخ الكنيسة القبطية الأرثوذكسية: قائمة البطاركة، المجامع المسكونية الثلاثة الأولى، تأسيس الكرازة المرقسية، وأهم محطات تاريخ الأقباط.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "تاريخ الكنيسة القبطية", "inLanguage": "ar" }
    },
    "/orthodox/books": {
      title: "كتب الآباء القبطية الأرثوذكسية | مكتبة لاهوتية | أرثوذوكسيات",
      desc: "مكتبة الكتب القبطية الأرثوذكسية: كتب الآباء، كتب اللاهوت، كتب الروحانيات، كتب البابا شنوده الثالث وكبار آباء الكنيسة القبطية.",
      schema: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "مكتبة الكتب القبطية", "inLanguage": "ar" }
    },
    "/orthodox/qa": {
      title: "أسئلة وأجوبة لاهوتية قبطية | أرثوذوكسيات",
      desc: "أسئلة وأجوبة لاهوتية شاملة في العقيدة القبطية الأرثوذكسية، الإيمان، الطقوس، الأسرار، والحياة الروحية المسيحية.",
      schema: { "@context": "https://schema.org", "@type": "FAQPage", "name": "أسئلة وأجوبة لاهوتية قبطية", "inLanguage": "ar" }
    },
    "/orthodox/figures": {
      title: "شخصيات الكنيسة القبطية الأرثوذكسية | آباء وقديسون | أرثوذوكسيات",
      desc: "شخصيات الكنيسة القبطية الأرثوذكسية: البطاركة، الأساقفة، الآباء، الرهبان، ورجال الفكر القبطي عبر العصور.",
      schema: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "شخصيات الكنيسة القبطية", "inLanguage": "ar" }
    },
    "/orthodox/apocrypha": {
      title: "الأسفار القانونية الثانية (الإبوكريفا) | أرثوذوكسيات قبطية",
      desc: "الأسفار القانونية الثانية المعتمدة في الكنيسة القبطية الأرثوذكسية: طوبيا، يهوديت، الحكمة، يشوع بن سيراخ، باروخ، المكابيين وغيرها.",
      schema: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "الأسفار القانونية الثانية", "inLanguage": "ar" }
    },
    "/orthodox/tafseer": {
      title: "تفاسير الآباء الأقباط | تفسير آبائي للكتاب المقدس | أرثوذوكسيات",
      desc: "تفاسير الآباء الأقباط للكتاب المقدس: تفسير القديس يوحنا ذهبي الفم، أوريجانوس، كيرلس الإسكندري، أثناسيوس، وأنبا شنوده الثالث.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "تفاسير الآباء الأقباط", "inLanguage": "ar" }
    },
    "/orthodox/maps": {
      title: "خرائط الكتاب المقدس | جغرافيا الأرض المقدسة | أرثوذوكسيات",
      desc: "خرائط الكتاب المقدس التفاعلية: مواقع الأحداث في العهد القديم والجديد، رحلات الآباء، وأسفار الرسول بولس، وجغرافيا الأرض المقدسة.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "خرائط الكتاب المقدس", "inLanguage": "ar" }
    },
    "/orthodox/pope-qa": {
      title: "أسئلة وأجوبة قداسة البابا شنودة الثالث | أرثوذوكسيات",
      desc: "مجموعة شاملة من أسئلة وأجوبة قداسة البابا شنودة الثالث في العقيدة، الإيمان، الحياة الروحية، الزواج، والقضايا اللاهوتية المعاصرة.",
      schema: { "@context": "https://schema.org", "@type": "FAQPage", "name": "أسئلة البابا شنودة الثالث", "inLanguage": "ar" }
    },
    "/sitemap": {
      title: "خريطة الموقع | الكتاب المقدس رفيقي",
      desc: "خريطة كاملة لجميع صفحات رفيقي: الكتاب المقدس، الخولاجي، الأجبية، السنكسار، القطمارس، الألحان القبطية، وأكثر.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "خريطة الموقع", "inLanguage": "ar" }
    },
    "/terms": {
      title: "شروط وأحكام الاستخدام | رفيقي",
      desc: "اقرأ شروط وأحكام استخدام منصة رفيقي للكتاب المقدس، وسياسة الخصوصية والحقوق والمسؤوليات.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "شروط الاستخدام", "inLanguage": "ar" }
    },
    "/premium": {
      title: "اشتراك بريميوم | رفيقي - الكتاب المقدس",
      desc: "احصل على ميزات متقدمة: تحليل المشاعر، البحث الذكي بالمعنى، اقتراحات آيات مخصصة، وروابط عظات يوتيوب — اشترك الآن.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "اشتراك بريميوم رفيقي", "inLanguage": "ar" }
    },
    "/church": {
      title: "الكنائس القبطية الأرثوذكسية | رفيقي",
      desc: "دليل الكنائس القبطية الأرثوذكسية — ابحث عن كنيستك، تواصل مع مجتمعك، واكتشف الكنائس القريبة منك.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "دليل الكنائس القبطية", "inLanguage": "ar" }
    },
    "/challenge": {
      title: "تحدي القراءة المقدسة | رفيقي",
      desc: "شارك في تحديات قراءة الكتاب المقدس، نافس أصدقاءك، واحرز إنجازات روحية مميزة.",
      schema: { "@context": "https://schema.org", "@type": "WebPage", "name": "تحدي القراءة المقدسة", "inLanguage": "ar" }
    }
  };

  const page = pages[path];
  if (!page) return null;

  const canonical = `${SITE}${path === '/' ? '' : path}`;

  const richBodies: Record<string, string> = {
    "/": `<h1>الكتاب المقدس رفيقي — رفيقك الروحي اليومي</h1>
<p>${page.desc}</p>
<nav><ul>
<li><a href="${SITE}/bible">قراءة الكتاب المقدس كاملاً — العهد القديم والجديد</a></li>
<li><a href="${SITE}/plans">خطط قراءة الكتاب المقدس اليومية</a></li>
<li><a href="${SITE}/emotions">آيات حسب مشاعرك: فرح، حزن، قلق، خوف، أمل</a></li>
<li><a href="${SITE}/kids">قصص الكتاب المقدس للأطفال</a></li>
<li><a href="${SITE}/orthodox">الأرثوذوكسيات: أجبية، سنكسار، خولاجي، ألحان</a></li>
<li><a href="${SITE}/daily-verse">آية اليوم من الكتاب المقدس</a></li>
<li><a href="${SITE}/search">البحث في الكتاب المقدس</a></li>
</ul></nav>`,

    "/kids": `<h1>قصص الكتاب المقدس للأطفال</h1>
<p>${page.desc}</p>
<p>يتضمن قسم الأطفال في رفيقي مجموعة من القصص المصورة المستوحاة من الكتاب المقدس، تُقدَّم بأسلوب مبسط ومناسب للأطفال المسيحيين. تشمل قصصاً عن النبي موسى، والنبي يوسف، وداوود وجالوت، وولادة السيد المسيح، والمجوس، وإيليا النبي، وغيرها.</p>
<h2>اكتشف قصص الكتاب المقدس للأطفال</h2>
<ul>
<li><a href="${SITE}/kids/stories">جميع القصص المصورة للأطفال</a></li>
<li><a href="${SITE}/kids/story/1">قصة النبي موسى وعبور البحر الأحمر</a></li>
<li><a href="${SITE}/kids/story/2">قصة النبي يوسف وإخوته</a></li>
<li><a href="${SITE}/kids/story/3">قصة داوود وجالوت</a></li>
<li><a href="${SITE}/kids/story/4">ميلاد السيد المسيح</a></li>
<li><a href="${SITE}/kids/story/5">قصة نوح والفلك</a></li>
</ul>
<h2>لماذا رفيقي لأطفالك؟</h2>
<p>نقدم محتوى آمناً وتعليمياً يساعد الأطفال المسيحيين على التعرف على قصص الكتاب المقدس بطريقة شيقة ومبسطة، مع فيديوهات تعليمية مناسبة للأعمار الصغيرة.</p>`,

    "/orthodox": `<h1>أرثوذوكسيات — المحتوى القبطي الأرثوذكسي الشامل</h1>
<p>${page.desc}</p>
<h2>أقسام الأرثوذوكسيات</h2>
<ul>
<li><a href="${SITE}/orthodox/agpeya">كتاب الأجبية — ساعات الصلاة السبع القبطية</a>: صلاة باكر، الساعة الثالثة، السادسة، التاسعة، الغروب، النوم، نصف الليل.</li>
<li><a href="${SITE}/orthodox/synaxarium">السنكسار القبطي</a>: سير القديسين والشهداء الأقباط لكل يوم من أيام السنة القبطية.</li>
<li><a href="${SITE}/orthodox/kholagy">الخولاجي المقدس</a>: نصوص قداس القديس باسيليوس الكبير، قداس غريغوريوس اللاهوتي، وقداس كيرلس بالعربي والقبطي.</li>
<li><a href="${SITE}/orthodox/hymns">الألحان القبطية والإبصلمودية</a>: ألحان القداس الإلهي، تسبحة نصف الليل، إبصلمودية كيهك.</li>
<li><a href="${SITE}/orthodox/katameros">القطمارس</a>: القراءات الليتورجية اليومية للقداس — بولس، كاثوليكون، إبركسيس، مزامير، إنجيل.</li>
<li><a href="${SITE}/orthodox/deacon">مردات الشماس</a>: كيرياليسون، مرد الاعتراف، مردات رفع البخور.</li>
<li><a href="${SITE}/orthodox/saints">سير القديسين الأقباط</a>: حياة وقصص القديسين والشهداء الأقباط الأرثوذكس.</li>
<li><a href="${SITE}/orthodox/creed">قانون الإيمان النيقاوي</a>: نص قانون الإيمان المسكوني الكامل.</li>
<li><a href="${SITE}/orthodox/books">الكتب الأرثوذكسية</a>: مراجع ومصادر الكنيسة القبطية الأرثوذكسية.</li>
<li><a href="${SITE}/orthodox/tafseer">التفسير الأرثوذكسي</a>: تفسير آيات الكتاب المقدس من منظور أرثوذكسي قبطي.</li>
</ul>
<h2>عن الكنيسة القبطية الأرثوذكسية</h2>
<p>الكنيسة القبطية الأرثوذكسية هي من أقدم الكنائس المسيحية في العالم، تأسست على يد القديس مرقس الرسول في مصر. تتميز بتراث ليتورجي وروحي عريق يمتد لأكثر من ألفي عام، يشمل اللغة القبطية، والألحان القديمة، والطقوس والقداسات الإلهية.</p>`,

    "/bible": `<h1>قراءة الكتاب المقدس بالعربية</h1>
<p>${page.desc}</p>
<h2>أسفار الكتاب المقدس</h2>
<h3>العهد القديم</h3>
<p>يشتمل الكتاب المقدس العهد القديم على 39 سفراً (أو 46 سفراً في الترجمة الكاثوليكية) تبدأ بسفر التكوين وتنتهي بسفر ملاخي. تشمل: التكوين، الخروج، اللاويين، العدد، التثنية، يشوع، القضاة، راعوث، صموئيل، الملوك، الأيام، عزرا، نحميا، أستير، أيوب، المزامير، الأمثال، الجامعة، نشيد الأناشيد، إشعياء، إرميا، حزقيال، دانيال، وسائر الأنبياء الصغار.</p>
<h3>العهد الجديد</h3>
<p>يشتمل العهد الجديد على 27 سفراً تبدأ بإنجيل متى وتنتهي برؤيا يوحنا. تشمل: متى، مرقس، لوقا، يوحنا، أعمال الرسل، رسائل بولس الرسول، رسائل عامة، وسفر الرؤيا.</p>
<p><a href="${SITE}/bible/تكوين/1">اقرأ سفر التكوين — الإصحاح الأول</a></p>
<p><a href="${SITE}/bible/مزامير/23">اقرأ مزمور 23 — الرب راعيَّ</a></p>
<p><a href="${SITE}/bible/يوحنا/3">اقرأ إنجيل يوحنا — الإصحاح الثالث</a></p>`,

    "/plans": `<h1>خطط قراءة الكتاب المقدس</h1>
<p>${page.desc}</p>
<h2>خطط القراءة المتاحة</h2>
<ul>
<li><a href="${SITE}/plans/1">قراءة الكتاب المقدس في سنة</a></li>
<li><a href="${SITE}/plans/2">خطة قراءة العهد الجديد</a></li>
<li><a href="${SITE}/plans/3">خطة قراءة المزامير</a></li>
<li><a href="${SITE}/plans/4">خطة قراءة الأمثال</a></li>
<li><a href="${SITE}/plans/5">خطة قراءة البداية للمبتدئين</a></li>
</ul>`,

    "/emotions": `<h1>آيات الكتاب المقدس حسب المشاعر</h1>
<p>${page.desc}</p>
<h2>اختر مشاعرك واعثر على الآيات المناسبة</h2>
<ul>
<li><a href="${SITE}/emotions/فرح">آيات عن الفرح والبهجة</a></li>
<li><a href="${SITE}/emotions/حزن">آيات عن الحزن والعزاء</a></li>
<li><a href="${SITE}/emotions/قلق">آيات عن القلق والاطمئنان</a></li>
<li><a href="${SITE}/emotions/خوف">آيات عن الخوف والشجاعة</a></li>
<li><a href="${SITE}/emotions/سلام">آيات عن السلام والراحة</a></li>
<li><a href="${SITE}/emotions/رجاء">آيات عن الرجاء والأمل</a></li>
<li><a href="${SITE}/emotions/شكر">آيات عن الشكر والامتنان</a></li>
<li><a href="${SITE}/emotions/محبة">آيات عن المحبة</a></li>
<li><a href="${SITE}/emotions/إيمان">آيات عن الإيمان</a></li>
<li><a href="${SITE}/emotions/صبر">آيات عن الصبر والثبات</a></li>
<li><a href="${SITE}/emotions/وحدة">آيات عن الوحدة والأنيس الروحي</a></li>
<li><a href="${SITE}/emotions/حكمة">آيات عن الحكمة والتمييز</a></li>
<li><a href="${SITE}/emotions/شفاء">آيات عن الشفاء والبرء</a></li>
<li><a href="${SITE}/emotions/غضب">آيات عن الغضب وضبط النفس</a></li>
</ul>
<h2>لماذا تبحث عن آيات حسب مشاعرك؟</h2>
<p>الكتاب المقدس يخاطب كل حالة إنسانية. سواء كنت تمر بضيقة، فرح، أو قلق، ستجد في صفحات الكتاب المقدس كلمات تُعزيك وتُقويك. اختر ما يناسب حالتك الآن.</p>`,

    "/search": `<h1>البحث في الكتاب المقدس</h1>
<p>${page.desc}</p>
<h2>بحث ذكي في أكثر من 31,000 آية</h2>
<p>يوفر موقع رفيقي محرك بحث قرآني متقدم يسمح لك بالبحث في جميع آيات الكتاب المقدس العربي. يدعم البحث بالكلمات الكاملة والجزئية، ويعرض النتائج مع السياق الكامل للآية.</p>
<h2>ما يمكنك البحث عنه</h2>
<ul>
<li>ابحث عن آية بكلمة مفتاحية مثل "محبة" أو "سلام" أو "إيمان"</li>
<li>ابحث عن شخصية مثل "موسى" أو "إبراهيم" أو "بولس"</li>
<li>ابحث عن موضوع مثل "الصلاة" أو "الصوم" أو "المعمودية"</li>
<li>ابحث عن عبارة كاملة من الكتاب المقدس</li>
</ul>
<h2>آيات مشهورة يمكن البحث عنها</h2>
<ul>
<li><a href="${SITE}/search?q=الرب+راعيَّ">الرب راعيَّ فلا يعوزني شيء — مزمور 23</a></li>
<li><a href="${SITE}/search?q=محبة+الله">هكذا أحب الله العالم — يوحنا 3:16</a></li>
<li><a href="${SITE}/search?q=اطلبوا+تجدوا">اطلبوا تجدوا، اقرعوا يُفتح لكم — متى 7:7</a></li>
<li><a href="${SITE}/search?q=لا+تخف">لا تخف لأني معك — إشعياء 41:10</a></li>
</ul>`,
  };

  const body = richBodies[path] || `<h1>${page.title.split('|')[0].trim()}</h1>\n<p>${page.desc}</p>`;

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
    res.set("X-Robots-Tag", "index, follow");
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
  res.set("X-Robots-Tag", "index, follow");
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

  // ── Church pages: /church/:id ─────────────────────────────────────────────
  const churchMatch = path.match(/^\/church\/(\d+)$/);
  if (churchMatch) {
    const churchId = parseInt(churchMatch[1], 10);
    try {
      const cacheKey = `ch-loc:${churchId}`;
      if (serveCached(res, cacheKey)) return;

      const church = await storage.getChurchById(churchId);
      if (!church || church.status !== 'approved') return next();

      const canonical = `${SITE}/church/${churchId}`;
      const title = `${church.name} | كنيسة قبطية أرثوذكسية — الكتاب المقدس رفيقي`;
      const description = `${church.name} — كنيسة قبطية أرثوذكسية في ${church.governorate}. تابع قراءة الكتاب المقدس مع مجتمع كنيستك.`;

      const schema = [
        {
          "@context": "https://schema.org",
          "@type": "Church",
          "name": church.name,
          "description": description,
          "url": canonical,
          "inLanguage": "ar",
          "address": {
            "@type": "PostalAddress",
            "addressRegion": church.governorate,
            "addressCountry": "EG"
          },
          "denomination": "القبطية الأرثوذكسية"
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE },
            { "@type": "ListItem", "position": 2, "name": "الكنائس", "item": `${SITE}/church` },
            { "@type": "ListItem", "position": 3, "name": church.name, "item": canonical }
          ]
        }
      ];

      const body = `
<nav aria-label="breadcrumb"><a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/church">الكنائس</a> &rsaquo; ${esc(church.name)}</nav>
<h1>${esc(church.name)}</h1>
<p><strong>المحافظة:</strong> ${esc(church.governorate)}</p>
<p>${esc(description)}</p>
<nav>
  <ul>
    <li><a href="${SITE}/bible">قراءة الكتاب المقدس</a></li>
    <li><a href="${SITE}/plans">خطط القراءة</a></li>
    <li><a href="${SITE}/church">جميع الكنائس</a></li>
  </ul>
</nav>`;

      const html = wrapHtml(title, description, canonical, body, schema);
      return cacheAndServe(res, cacheKey, html);
    } catch (err) {
      console.error("[bot-snapshot] Church error:", err);
      return next();
    }
  }

  // ── Agpeya index: /orthodox/agpeya ───────────────────────────────────────
  if (path === "/orthodox/agpeya") {
    const cacheKey = "ag:index";
    if (serveCached(res, cacheKey)) return;
    const canonical = `${SITE}/orthodox/agpeya`;
    const title = "كتاب الأجبية القبطي — ساعات الصلاة السبع | الكتاب المقدس رفيقي";
    const description = "الأجبية كتاب الصلوات اليومية القبطي الأرثوذكسي، يحتوي على سبع ساعات صلاة يرتلها المؤمنون منذ القرن الرابع الميلادي.";
    const hoursHtml = agpeyaHoursFull.map(h =>
      `<li><a href="${SITE}/orthodox/agpeya/${h.id}">${esc(h.name)} — ${esc(h.arabicTime)}</a></li>`
    ).join("\n");
    const schema = [
      {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": "الأجبية",
        "inLanguage": "ar",
        "about": "الكنيسة القبطية الأرثوذكسية",
        "url": canonical,
        "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
      },
      buildFaqSchema([
        { q: "ما هي الأجبية القبطية؟", a: "الأجبية هي كتاب الصلوات اليومية للمسيحي القبطي الأرثوذكسي، ويتضمن سبع ساعات صلاة على مدار اليوم والليل: باكر، الثالثة، السادسة، التاسعة، الغروب، النوم، ونصف الليل." },
        { q: "كم عدد ساعات الصلاة في الأجبية؟", a: "تشمل الأجبية سبع ساعات صلاة: ساعة باكر، الساعة الثالثة، الساعة السادسة، الساعة التاسعة، ساعة الغروب، ساعة النوم، وساعة نصف الليل." },
        { q: "من أين جاءت الأجبية القبطية؟", a: "الأجبية ترجع في أصولها إلى الصلوات الليتورجية المبكرة للكنيسة القبطية منذ القرن الرابع الميلادي، وهي مستوحاة من المزامير وصلوات الرهبان والآباء الأوائل." }
      ])
    ];
    const body = `
<nav aria-label="breadcrumb"><a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/orthodox">أرثوذوكسيات</a> &rsaquo; الأجبية</nav>
<h1>كتاب الأجبية — ساعات الصلاة السبع</h1>
<p>${esc(description)}</p>
<nav><h2>الساعات السبع</h2><ul>${hoursHtml}</ul></nav>`;
    return cacheAndServe(res, cacheKey, wrapHtml(title, description, canonical, body, schema, buildOrthodoxOgUrl("الأجبية القبطية")));
  }

  // ── Agpeya hour: /orthodox/agpeya/:hourId ────────────────────────────────
  const agpeyaHourMatch = path.match(/^\/orthodox\/agpeya\/([^/]+)$/);
  if (agpeyaHourMatch) {
    const hourId = agpeyaHourMatch[1];
    const hour = agpeyaHoursFull.find(h => h.id === hourId);
    if (!hour) return next();
    const cacheKey = `ag:${hourId}`;
    if (serveCached(res, cacheKey)) return;
    const canonical = `${SITE}/orthodox/agpeya/${hourId}`;
    const title = `${hour.name} — الأجبية القبطية | الكتاب المقدس رفيقي`;
    const description = `${hour.name}: ${hour.description} مزامير: ${hour.psalms}. إنجيل: ${hour.gospel}.`;
    const allPrayers = [...commonOpeningPrayers, ...hour.prayers];
    const prayersHtml = allPrayers.map(p =>
      `<section><h2>${esc(p.title)}${p.role ? ` (${esc(p.role)})` : ""}</h2><p>${esc(p.text.substring(0, 500))}${p.text.length > 500 ? "..." : ""}</p></section>`
    ).join("\n");
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "inLanguage": "ar",
      "url": canonical,
      "isPartOf": { "@type": "Book", "name": "الأجبية", "url": `${SITE}/orthodox/agpeya` }
    };
    const body = `
<nav aria-label="breadcrumb"><a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/orthodox">أرثوذوكسيات</a> &rsaquo; <a href="${SITE}/orthodox/agpeya">الأجبية</a> &rsaquo; ${esc(hour.name)}</nav>
<h1>${esc(hour.name)}</h1>
<p>${esc(description)}</p>
${prayersHtml}
<nav><a href="${SITE}/orthodox/agpeya">← جميع ساعات الأجبية</a></nav>`;
    return cacheAndServe(res, cacheKey, wrapHtml(title, description, canonical, body, schema, buildOrthodoxOgUrl(hour.name, hour.arabicTime)));
  }

  // ── Synaxarium index: /orthodox/synaxarium ────────────────────────────────
  if (path === "/orthodox/synaxarium") {
    const cacheKey = "sx:index";
    if (serveCached(res, cacheKey)) return;
    const canonical = `${SITE}/orthodox/synaxarium`;
    const title = "السنكسار القبطي الأرثوذكسي — سير القديسين والشهداء | الكتاب المقدس رفيقي";
    const description = "السنكسار كتاب سير القديسين والشهداء والأعياد في الكنيسة القبطية الأرثوذكسية، مرتّباً حسب التقويم القبطي (13 شهراً).";
    const monthsHtml = synaxariumMonths.map(m =>
      `<li><a href="${SITE}/orthodox/synaxarium/${m.id}/1">${esc(m.arabicName)} (${esc(m.copticName)}) — ${esc(m.gregStart)}</a></li>`
    ).join("\n");
    const schema = [
      {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": "السنكسار القبطي",
        "inLanguage": "ar",
        "about": "سير القديسين الأقباط",
        "url": canonical,
        "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
      },
      buildFaqSchema([
        { q: "ما هو السنكسار القبطي؟", a: "السنكسار هو كتاب سير القديسين والشهداء في الكنيسة القبطية الأرثوذكسية، مرتَّباً حسب التقويم القبطي (13 شهراً). يُقرأ منه يومياً في القداس الإلهي للتذكر بسير القديسين." },
        { q: "كم عدد الأشهر في التقويم القبطي؟", a: "التقويم القبطي يتكون من 13 شهراً: 12 شهراً كل منها 30 يوماً، وشهر صغير (نسيء) من 5 إلى 6 أيام." },
        { q: "من هم أشهر القديسين الأقباط؟", a: "من أشهر القديسين الأقباط: القديس مارك الرسول مؤسس الكرازة، القديسة دميانة، القديس أباكير ويوحنا، الشهيد أبو سيفين، والأنبا أنطونيوس أبو الرهبانية." }
      ])
    ];
    const body = `
<nav aria-label="breadcrumb"><a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/orthodox">أرثوذوكسيات</a> &rsaquo; السنكسار</nav>
<h1>السنكسار القبطي الأرثوذكسي</h1>
<p>${esc(description)}</p>
<nav><h2>الأشهر القبطية</h2><ul>${monthsHtml}</ul></nav>`;
    return cacheAndServe(res, cacheKey, wrapHtml(title, description, canonical, body, schema, buildOrthodoxOgUrl("السنكسار القبطي")));
  }

  // ── Synaxarium day: /orthodox/synaxarium/:monthId/:day ────────────────────
  const synaxariumDayMatch = path.match(/^\/orthodox\/synaxarium\/(\d+)\/(\d+)$/);
  if (synaxariumDayMatch) {
    const monthId = parseInt(synaxariumDayMatch[1], 10);
    const day = parseInt(synaxariumDayMatch[2], 10);
    const month = getMonthById(monthId);
    if (!month || day < 1 || day > 30) return next();
    const cacheKey = `sx:${monthId}:${day}`;
    if (serveCached(res, cacheKey)) return;
    const canonical = `${SITE}/orthodox/synaxarium/${monthId}/${day}`;
    const entries = getDayEntries(monthId, day);
    const title = `سنكسار ${month.arabicName} ${day} — ${entries.map(e => e.name).slice(0, 2).join("، ")} | الكتاب المقدس رفيقي`;
    const description = entries.length > 0
      ? `سنكسار ${month.arabicName} ${day}: ${entries.map(e => `${e.name} — ${e.description.substring(0, 80)}`).join(". ")}.`
      : `سنكسار ${month.arabicName} ${day} — ${month.copticName} ${day}.`;
    const entriesHtml = entries.map(e =>
      `<article><h2>${entryTypeIcon[e.type]} ${esc(e.name)} <span>(${esc(e.type)})</span></h2><p>${esc(e.description)}</p></article>`
    ).join("\n");
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "inLanguage": "ar",
      "url": canonical,
      "datePublished": month.gregStart,
      "isPartOf": { "@type": "Book", "name": "السنكسار القبطي", "url": `${SITE}/orthodox/synaxarium` }
    };
    const prevDay = day > 1 ? `<a href="${SITE}/orthodox/synaxarium/${monthId}/${day - 1}">${esc(month.arabicName)} ${day - 1}</a>` : "";
    const nextDay = day < month.days.length ? `<a href="${SITE}/orthodox/synaxarium/${monthId}/${day + 1}">${esc(month.arabicName)} ${day + 1}</a>` : "";
    const body = `
<nav aria-label="breadcrumb"><a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/orthodox">أرثوذوكسيات</a> &rsaquo; <a href="${SITE}/orthodox/synaxarium">السنكسار</a> &rsaquo; ${esc(month.arabicName)} ${day}</nav>
<h1>سنكسار ${esc(month.arabicName)} ${day}</h1>
<p>${esc(description)}</p>
${entriesHtml}
<nav>${prevDay} | <a href="${SITE}/orthodox/synaxarium">جميع الأشهر</a> | ${nextDay}</nav>`;
    return cacheAndServe(res, cacheKey, wrapHtml(title, description, canonical, body, schema));
  }

  const staticSnapshot = buildStaticPageSnapshot(path);
  if (staticSnapshot) {
    const cacheKey = `st:${path}`;
    if (serveCached(res, cacheKey)) return;
    return cacheAndServe(res, cacheKey, staticSnapshot);
  }

  // ── Kholagy index: /kholagy ───────────────────────────────────────────────
  if (path === "/kholagy") {
    const cacheKey = "kh:index";
    if (serveCached(res, cacheKey)) return;
    const canonical = `${SITE}/kholagy`;
    const title = "الخولاجي المقدس — القداسات القبطية الأرثوذكسية | الكتاب المقدس رفيقي";
    const description = "اقرأ نصوص القداسات القبطية الأرثوذكسية الثلاثة: قداس القديس باسيليوس وغريغوريوس وكيرلس، بالعربية والقبطية.";
    const liturgiesHtml = liturgies.map(lit =>
      `<li><a href="${SITE}/kholagy/${lit.id}">${esc(lit.name)}</a> — ${esc(lit.occasion)}</li>`
    ).join("\n");
    const schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "الخولاجي المقدس",
      "description": description,
      "inLanguage": "ar",
      "url": canonical,
      "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
    };
    const body = `
<nav aria-label="breadcrumb"><a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/orthodox">أرثوذوكسيات</a> &rsaquo; الخولاجي المقدس</nav>
<h1>الخولاجي المقدس</h1>
<p>${esc(description)}</p>
<ul>${liturgiesHtml}</ul>`;
    return cacheAndServe(res, cacheKey, wrapHtml(title, description, canonical, body, schema));
  }

  // ── Kholagy liturgy index: /kholagy/:liturgyId ───────────────────────────
  const kholagyLiturgyMatch = path.match(/^\/kholagy\/([^/]+)$/);
  if (kholagyLiturgyMatch) {
    const liturgyId = kholagyLiturgyMatch[1];
    const liturgy = liturgies.find(l => l.id === liturgyId);
    if (!liturgy) return next();
    const cacheKey = `kh:${liturgyId}`;
    if (serveCached(res, cacheKey)) return;
    const canonical = `${SITE}/kholagy/${liturgyId}`;
    const title = `${liturgy.name} — الخولاجي المقدس | الكتاب المقدس رفيقي`;
    const description = liturgy.description;
    const chaptersHtml = liturgy.chapters.map(ch =>
      `<li><a href="${SITE}/kholagy/${liturgyId}/${ch.id}">${esc(ch.title)}</a>${ch.description ? ` — ${esc(ch.description.substring(0, 80))}` : ""}</li>`
    ).join("\n");
    const schema = {
      "@context": "https://schema.org",
      "@type": "Book",
      "name": liturgy.name,
      "description": description,
      "inLanguage": "ar",
      "url": canonical,
      "numberOfPages": liturgy.chapters.length,
      "genre": "Liturgy",
      "about": "القداس القبطي الأرثوذكسي",
      "publisher": { "@type": "Organization", "name": "الكتاب المقدس رفيقي", "url": SITE }
    };
    const body = `
<nav aria-label="breadcrumb"><a href="${SITE}">الرئيسية</a> &rsaquo; <a href="${SITE}/orthodox">أرثوذوكسيات</a> &rsaquo; <a href="${SITE}/kholagy">الخولاجي</a> &rsaquo; ${esc(liturgy.name)}</nav>
<h1>${esc(liturgy.name)}</h1>
<p><strong>يُقام في:</strong> ${esc(liturgy.occasion)}</p>
<p>${esc(description)}</p>
<nav aria-label="أقسام القداس"><h2>أقسام ${esc(liturgy.name)}</h2><ol>${chaptersHtml}</ol></nav>`;
    return cacheAndServe(res, cacheKey, wrapHtml(title, description, canonical, body, schema));
  }

  // ── Kholagy chapter: /kholagy/:liturgyId/:chapterId ──────────────────────
  const kholagyChapterMatch = path.match(/^\/kholagy\/([^/]+)\/([^/]+)$/);
  if (kholagyChapterMatch) {
    const liturgyId = kholagyChapterMatch[1];
    const chapterId = kholagyChapterMatch[2];
    const liturgy = liturgies.find(l => l.id === liturgyId);
    if (!liturgy) return next();
    const chapter = liturgy.chapters.find(c => c.id === chapterId);
    if (!chapter) return next();
    const cacheKey = `kh:${liturgyId}:${chapterId}`;
    if (serveCached(res, cacheKey)) return;
    const canonical = `${SITE}/kholagy/${liturgyId}/${chapterId}`;
    const title = `${chapter.title} — ${liturgy.name} — الخولاجي | الكتاب المقدس رفيقي`;
    const description = chapter.description ?? `${chapter.title} من ${liturgy.name} — نص القداس القبطي بالعربية والقبطية`;
    const partsHtml = chapter.parts.map(p =>
      `<section>
        <h3>${esc(p.title)}${p.role ? ` <span>(${esc(p.role)})</span>` : ""}</h3>
        <p>${esc(p.text.substring(0, 600))}${p.text.length > 600 ? "..." : ""}</p>
      </section>`
    ).join("\n");
    const chapterIdx = liturgy.chapters.findIndex(c => c.id === chapterId);
    const prevChapter = chapterIdx > 0 ? liturgy.chapters[chapterIdx - 1] : null;
    const nextChapter = chapterIdx < liturgy.chapters.length - 1 ? liturgy.chapters[chapterIdx + 1] : null;
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "inLanguage": "ar",
      "url": canonical,
      "isPartOf": { "@type": "Book", "name": liturgy.name, "url": `${SITE}/kholagy/${liturgyId}` },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE },
          { "@type": "ListItem", "position": 2, "name": "الخولاجي", "item": `${SITE}/kholagy` },
          { "@type": "ListItem", "position": 3, "name": liturgy.name, "item": `${SITE}/kholagy/${liturgyId}` },
          { "@type": "ListItem", "position": 4, "name": chapter.title, "item": canonical }
        ]
      }
    };
    const body = `
<nav aria-label="breadcrumb">
  <a href="${SITE}">الرئيسية</a> &rsaquo;
  <a href="${SITE}/orthodox">أرثوذوكسيات</a> &rsaquo;
  <a href="${SITE}/kholagy">الخولاجي</a> &rsaquo;
  <a href="${SITE}/kholagy/${liturgyId}">${esc(liturgy.name)}</a> &rsaquo;
  ${esc(chapter.title)}
</nav>
<h1>${esc(chapter.title)}</h1>
${chapter.description ? `<p>${esc(chapter.description)}</p>` : ""}
${partsHtml}
<nav aria-label="تنقل الأقسام">
  ${prevChapter ? `<a href="${SITE}/kholagy/${liturgyId}/${prevChapter.id}">← ${esc(prevChapter.title)}</a>` : ""}
  &nbsp;|&nbsp;
  ${nextChapter ? `<a href="${SITE}/kholagy/${liturgyId}/${nextChapter.id}">${esc(nextChapter.title)} →</a>` : ""}
</nav>`;
    return cacheAndServe(res, cacheKey, wrapHtml(title, description, canonical, body, schema));
  }

  next();
}
