/**
 * Smart Title Optimizer — Phase 6
 * Generates intent-aware, keyword-rich titles for better CTR.
 */

import { detectIntent, type IntentCluster } from './seo-intent';

const SITE_SUFFIX = 'الكتاب المقدس رفيقي';

const INTENT_TITLE_TEMPLATES: Record<IntentCluster, (kw: string) => string> = {
  emotional:   (kw) => `آيات عن ${kw} والتعزية الروحية من الكتاب المقدس`,
  theological: (kw) => `تفسير مفهوم ${kw} في الكتاب المقدس`,
  daily:       (kw) => `آيات يومية عن ${kw} | القراءة اليومية`,
  topical:     (kw) => `آيات الكتاب المقدس عن ${kw} | بحث شامل`,
  historical:  (kw) => `دراسة ${kw} في الكتاب المقدس | شرح وتفسير`,
  general:     (kw) => `آيات الكتاب المقدس عن ${kw}`,
};

const WELL_KNOWN_TITLES: Record<string, string> = {
  سلام:    'آيات عن السلام والطمأنينة من الكتاب المقدس | سلام الله',
  خوف:     'آيات تشجيعية لمواجهة الخوف والقلق من الكتاب المقدس',
  حزن:     'آيات التعزية والأمل عند الحزن من الكتاب المقدس',
  فرح:     'آيات الفرح والابتهاج في الكتاب المقدس | كيف تجد الفرح الحقيقي',
  امل:     'آيات الأمل والرجاء من الكتاب المقدس | لا تيأس',
  محبه:    'آيات المحبة في الكتاب المقدس | الله محبة',
  صلاه:    'آيات الصلاة والدعاء من الكتاب المقدس',
  ايمان:   'آيات الإيمان واليقين من الكتاب المقدس',
  حكمه:    'آيات الحكمة من الكتاب المقدس | حكمة الله',
  صبر:     'آيات الصبر والثبات من الكتاب المقدس',
  شفاء:    'آيات الشفاء والبركة من الكتاب المقدس',
  خلاص:    'آيات الخلاص والفداء من الكتاب المقدس',
  توبه:    'آيات التوبة والغفران من الكتاب المقدس',
  قوه:     'آيات القوة والشجاعة من الكتاب المقدس',
  نعمه:    'آيات النعمة والبركة من الكتاب المقدس',
};

function normalizeAr(s: string): string {
  return s
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .trim();
}

export function generateSearchTitle(query: string): string {
  if (!query || !query.trim()) return `البحث في الكتاب المقدس | ${SITE_SUFFIX}`;

  const norm = normalizeAr(query.trim());

  // Check well-known titles first
  for (const [key, title] of Object.entries(WELL_KNOWN_TITLES)) {
    if (norm.includes(key) || key.includes(norm)) return title;
  }

  const { intent } = detectIntent(query);
  const template = INTENT_TITLE_TEMPLATES[intent];
  const displayQuery = query.trim();

  return `${template(displayQuery)} | ${SITE_SUFFIX}`;
}

export function generateBibleChapterTitle(bookName: string, chapter: number, verseCount: number): string {
  return `تفسير ${bookName} الإصحاح ${chapter} | قراءة ${verseCount} آية كاملة - ${SITE_SUFFIX}`;
}

export function generateBibleBookTitle(bookName: string, chaptersCount: number): string {
  return `تفسير ${bookName} كامل | ${chaptersCount} إصحاحاً - ${SITE_SUFFIX}`;
}

export function generateEmotionTitle(emotion: string): string {
  return `آيات عن ${emotion} | التغذية الروحية - ${SITE_SUFFIX}`;
}

export function generateFAQSchema(query: string, verses: Array<{ bookName: string; chapter: number; verse: number; text: string }>) {
  if (verses.length === 0) return null;

  const displayQuery = query.trim();
  const { intent } = detectIntent(query);

  const qaPairs = [
    {
      q: `ما هي أهم آيات الكتاب المقدس عن ${displayQuery}؟`,
      a: verses.slice(0, 3)
        .map(v => `${v.bookName} ${v.chapter}:${v.verse} — "${v.text.substring(0, 100)}"`)
        .join(' | '),
    },
    {
      q: `أين أجد آيات عن ${displayQuery} في الكتاب المقدس؟`,
      a: `يمكنك إيجاد آيات عن ${displayQuery} في كل من: ${verses.slice(0, 5).map(v => `${v.bookName} ${v.chapter}:${v.verse}`).join('، ')}.`,
    },
  ];

  if (intent === 'emotional') {
    qaPairs.push({
      q: `كيف يساعدني الكتاب المقدس عند ${displayQuery}؟`,
      a: `الكتاب المقدس يقدم كثيراً من آيات التعزية والأمل عند ${displayQuery}. يقول الرب في ${verses[0]?.bookName || 'الكتاب المقدس'}: "${(verses[0]?.text || '').substring(0, 120)}"`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qaPairs.map(pair => ({
      '@type': 'Question',
      name: pair.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: pair.a,
      },
    })),
  };
}
