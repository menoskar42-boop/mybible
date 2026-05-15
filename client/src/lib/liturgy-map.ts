// ── نظام الخرائط الموحّدة للقداسات الثلاثة ──────────────────────────────────
// يربط القسم الواحد (sectionKey) بشرائح من كل قداس بنفس الاسم المنطقي

import { kholagyLiturgies } from './kholagy-data';

export type LiturgyType = 'basil' | 'gregory' | 'cyril';

export interface LiturgySlide {
  id: string;
  role: 'priest' | 'deacon' | 'people' | 'all';
  title: string;
  text: string;
  copticText?: string;
}

export interface SectionMeta {
  sectionKey: string;
  label: string;
  icon: string;
}

export interface DeaconResponse {
  id: string;
  text: string;
  category: string;
}

// ── تحويل الدور إلى نوع موحّد
function normalizeRole(role?: string): LiturgySlide['role'] {
  if (!role) return 'priest';
  if (role.includes('شعب')) return 'people';
  if (role.includes('شماس')) return 'deacon';
  if (role.includes('كل')) return 'all';
  return 'priest';
}

// ── نصوص قبطية للأقسام الرئيسية
const COPTIC_TEXT_MAP: Record<string, string> = {
  'basil-opening': `Ⲡⲓⲱⲟⲩ ⲛ̀Ⲫⲛⲟⲩϯ ϧⲉⲛ ⲛⲓⲉⲧϩⲱⲟⲩⲧ ⲟⲩⲟϩ ϩⲓⲣⲏⲛⲏ ϩⲓϫⲉⲛ ⲡⲓⲕⲁϩⲓ ⲟⲩⲟϩ ⲟⲩⲑⲉⲗⲏⲗ ϧⲉⲛ ⲛⲓⲣⲱⲙⲓ.\nⲀⲛⲟⲩϩⲱⲥ ⲉⲣⲟⲕ ⲁⲛⲥ̀ⲙⲟⲩ ⲉⲣⲟⲕ ⲁⲛⲟⲩⲱϣⲧ ⲉⲣⲟⲕ ⲁⲛϯⲱⲟⲩ ⲉⲣⲟⲕ ⲁⲛϣⲡ ϩⲙⲟⲧ ⲉⲣⲟⲕ ⲉⲑⲃⲉ Ⲡⲉⲕⲛⲓϣϯ ⲛ̀ⲱⲟⲩ.\nⲠⲁⲛⲧⲟⲕⲣⲁⲧⲱⲣ Ⲡⲉⲛⲓⲱⲧ.\n\nⲠⲓϣⲏⲣⲓ Ⲛ̀ⲟⲩⲱⲧ Ⲁⲣⲭⲏⲉⲅⲉⲛⲏⲥ Ⲡⲉⲛϭⲟⲓⲥ Ⲓⲏⲥⲟⲩⲥ Ⲡⲓⲭ̀ⲣⲓⲥⲧⲟⲥ ⲛⲉⲙ Ⲡⲓⲡ̀ⲛⲉⲩⲙⲁ ⲉⲑⲟⲩⲁⲃ.`,
  'basil-synaxar': `Ⲁⲙⲟⲩ ϧⲉⲛ ⲟⲩⲏⲣⲏⲛⲏ Ⲙ̀Ⲡⲓⲭ̀ⲣⲓⲥⲧⲟⲥ ⲉⲛⲥⲱⲧⲉⲙ ⲉⲡⲓⲥⲩⲛⲁⲝⲁⲣⲓⲟⲛ.`,
  'basil-reconciliation': `Ⲁ̀ⲥⲡⲁⲍⲉⲥⲑⲉ ⲁ̀ⲗⲗⲏⲗⲟⲩⲥ — Ⲉⲓⲥ ⲁⲛⲁⲧⲟⲗⲁⲥ ⲃⲗⲉⲯⲁⲧⲉ\nⲈⲣⲁⲥⲡⲁⲍⲉ ⲣⲱⲟⲩ ϧⲉⲛ Ⲡⲓϩⲓⲣⲏⲛⲏ ⲉⲑⲟⲩⲁⲃ.`,
  'basil-creed': `Ⲙⲁⲣⲉⲛϫⲱ ⲙ̀ⲡⲓⲛⲓϣϯ ⲛ̀ϩⲟⲙⲟⲗⲟⲅⲓⲁ ⲛ̀ⲧⲉⲛⲛⲓⲥϯ ⲛ̀ⲁⲧⲟⲩ.`,
  'basil-anaphora': `Ⲡϭⲟⲓⲥ ⲛⲉⲙ ⲧⲏⲣⲟⲩ.\nⲚⲉⲙ ⲡⲉⲕⲡ̀ⲛⲉⲩⲙⲁ ϧⲱⲕ.`,
  'basil-commemoration': `Ⲁⲣⲓⲙⲉⲩⲓ Ⲛ̀ⲧⲉⲛⲭⲟⲓ ⲛⲉⲙ ⲧⲉⲛⲙⲁⲩ Ⲑⲉⲟⲧⲟⲕⲟⲥ Ⲙⲁⲣⲓⲁ ϯⲡⲁⲣⲑⲉⲛⲟⲥ ⲉⲑⲟⲩⲁⲃ. Ⲁ̀ⲙⲏⲛ.`,
  'basil-communion': `Ⲡⲓⲟⲩⲁⲃ Ⲛ̀ⲛⲓⲟⲩⲁⲃ.\n\nⲞⲩⲁⲓ ⲡⲉ Ⲫⲓⲱⲧ ⲉⲑⲟⲩⲁⲃ — Ⲟⲩⲁⲓ ⲡⲉ Ⲡⲓϣⲏⲣⲓ ⲉⲑⲟⲩⲁⲃ — Ⲟⲩⲁⲓ ⲡⲉ Ⲡⲓⲡ̀ⲛⲉⲩⲙⲁ ⲉⲑⲟⲩⲁⲃ. Ⲁ̀ⲙⲏⲛ.\n\nⲈⲩⲗⲟⲅⲏⲙⲉⲛⲟⲥ Ⲡϭⲟⲓⲥ Ⲓⲏⲥⲟⲩⲥ Ⲡⲓⲭ̀ⲣⲓⲥⲧⲟⲥ Ⲡϣⲏⲣⲓ Ⲙ̀Ⲫⲛⲟⲩϯ ϧⲉⲛ ⲧⲫⲉ ⲛⲉⲙ ⲡⲓⲕⲁϩⲓ.\nⲰⲥⲁⲛⲛⲁ ϧⲉⲛ ⲛⲓⲉⲧϩⲱⲟⲩⲧ. Ⲁ̀ⲙⲏⲛ.`,
  'basil-thanksgiving': `Ϣⲡ ϩⲙⲟⲧ ⲛⲁⲕ Ⲡⲉⲛϭⲟⲓⲥ Ⲡⲉⲛⲛⲟⲩϯ ⲉⲑⲃⲉ ⲧⲉⲛⲕⲟⲓⲛⲱⲛⲓⲁ ⲉⲃⲟⲗ ϧⲉⲛ Ⲡⲉⲕⲥⲱⲙⲁ ⲛⲉⲙ Ⲡⲉⲕⲥⲛⲟϥ ⲉⲑⲟⲩⲁⲃ ⲉⲧⲓⲙⲓ.`,
  'greg-anaphora': `Ⲛ̀ⲑⲟⲕ Ⲡⲉⲧⲉ ⲙ̀ⲙⲟⲛ ⲗⲁⲁⲩ ϭⲓⲛϭ ⲛ̀ⲥⲱⲕ ⲟⲩⲇⲉ ⲙ̀ⲙⲟⲛ ⲗⲁⲁⲩ ϯ Ⲛⲁⲕ.`,
  'cyril-anaphora': `Ⲁ̀ⲙⲏⲛ Ⲑⲉⲙⲉⲗⲓⲟⲩⲥ ⲛⲉⲙ Ⲑⲉⲡⲣⲉⲡⲓⲥ ⲛⲉⲙ Ⲑⲉⲙⲉⲑⲛⲁϭⲓ ⲉⲃⲉ ⲟⲩⲃⲉⲛ.`,
};

// ── دالة الأقسام لقداس معيّن (للاستخدام في لوحة التحكم وشاشة العرض)
export function getSectionsForLiturgy(liturgyType: LiturgyType): SectionMeta[] {
  const liturgy = kholagyLiturgies.find(l => l.id === liturgyType);
  if (!liturgy) return [];
  return liturgy.sections.map(s => ({
    sectionKey: s.id,
    label: s.title,
    icon: s.role.includes('كاهن') ? '✝️' : s.role.includes('شماس') ? '📜' : s.role.includes('شعب') ? '🙏' : '📖',
  }));
}

// ── مردات الشماس المشتركة
export const deaconResponses: DeaconResponse[] = [
  { id: 'd1', text: 'ولروحك أيضاً', category: 'تحية' },
  { id: 'd2', text: 'كيريه إليسون\nكيريه إليسون\nكيريه إليسون', category: 'ترحّم' },
  { id: 'd3', text: 'آمين — آمين — آمين', category: 'تأمين' },
  { id: 'd4', text: 'قدّسٌ للآب — قدّسٌ للابن — قدّسٌ للروح القدس', category: 'تقديس' },
  { id: 'd5', text: 'موتك نُبشّر يا رب\nوقيامتك نُعلن\nومجيئك نؤمن به', category: 'أنامنيسيس' },
  { id: 'd6', text: 'الجسد الطاهر الكريم\nالدم الطاهر الكريم', category: 'توزيع' },
  { id: 'd7', text: 'يا رب ارحمنا\nيا رب ارحمنا\nيا رب ارحمنا', category: 'ترحّم' },
  { id: 'd8', text: 'سبحوه بالصليبين\nاسجدوا له لأنه قدوس', category: 'تقديس' },
  { id: 'd9', text: 'هلليلويا — هلليلويا — هلليلويا', category: 'تسبيح' },
  { id: 'd10', text: 'إلى الأبد وأبد الآبدين\nآمين', category: 'تأمين' },
  { id: 'd11', text: 'أشكروا الرب لأنه صالح\nلأن إلى الأبد رحمته', category: 'شكر' },
  { id: 'd12', text: 'الإيمان الواحد\nالمعمودية الواحدة\nإله واحد', category: 'إيمان' },
];

// ── واجهة حالة الجلسة
export interface LiturgySession {
  sessionId: string;
  liturgyType: LiturgyType;
  sectionKey: string;
  slideIndex: number;
  deaconOverride: DeaconResponse | null;
  updatedAt: number;
}

export const defaultSession: LiturgySession = {
  sessionId: 'main',
  liturgyType: 'basil',
  sectionKey: 'basil-opening',
  slideIndex: 0,
  deaconOverride: null,
  updatedAt: Date.now(),
};

// ── دوال مساعدة
export function getSlidesForSection(liturgyType: LiturgyType, sectionKey: string): LiturgySlide[] {
  const liturgy = kholagyLiturgies.find(l => l.id === liturgyType);
  if (!liturgy) return [];
  const section = liturgy.sections.find(s => s.id === sectionKey);
  if (!section) return [];
  return [{
    id: section.id,
    role: normalizeRole(section.role),
    title: section.title,
    text: section.text,
    ...(COPTIC_TEXT_MAP[section.id] ? { copticText: COPTIC_TEXT_MAP[section.id] } : {}),
  }];
}

// ── تقسيم النص الطويل إلى صفحات بناءً على حد الأحرف
// يحافظ على حدود الفقرات ما أمكن
function splitTextIntoPages(text: string, maxChars: number): string[] {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  const pages: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const candidate = current ? current + '\n' + para : para;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) pages.push(current);
      // فقرة منفردة أطول من الحد — نقسمها عند حدود الكلمات
      if (para.length > maxChars) {
        const words = para.split(' ');
        let chunk = '';
        for (const word of words) {
          const next = chunk ? chunk + ' ' + word : word;
          if (next.length <= maxChars) {
            chunk = next;
          } else {
            if (chunk) pages.push(chunk);
            chunk = word;
          }
        }
        current = chunk;
      } else {
        current = para;
      }
    }
  }
  if (current) pages.push(current);
  return pages.length > 0 ? pages : [text];
}

// الحد الأقصى للأحرف في شريحة واحدة على شاشة التلفزيون
const SLIDE_MAX_CHARS = 200;

// ── نسخة مقسّمة من getSlidesForSection
// كل شريحة طويلة تُقسَّم إلى شرائح منفصلة بنفس الدور والعنوان
export function getSplitSlidesForSection(
  liturgyType: LiturgyType,
  sectionKey: string,
  maxChars = SLIDE_MAX_CHARS,
): LiturgySlide[] {
  const slides = getSlidesForSection(liturgyType, sectionKey);
  const result: LiturgySlide[] = [];

  for (const slide of slides) {
    if (slide.text.length <= maxChars) {
      result.push(slide);
      continue;
    }
    const pages = splitTextIntoPages(slide.text, maxChars);
    const copticPages = slide.copticText
      ? splitTextIntoPages(slide.copticText, maxChars)
      : [];
    pages.forEach((page, i) => {
      result.push({
        ...slide,
        id: `${slide.id}-p${i + 1}`,
        text: page,
        title: pages.length > 1 ? `${slide.title} (${i + 1}/${pages.length})` : slide.title,
        ...(copticPages[i] ? { copticText: copticPages[i] } : {}),
      });
    });
  }

  return result;
}

export function getLiturgyLabel(type: LiturgyType): string {
  return { basil: 'الباسيلي', gregory: 'الغريغوري', cyril: 'الكيرلسي' }[type];
}

export function getRoleColor(role: LiturgySlide['role']): string {
  return {
    priest: 'text-yellow-300',
    deacon: 'text-blue-300',
    people: 'text-green-300',
    all: 'text-purple-300',
  }[role];
}

export function getRoleLabel(role: LiturgySlide['role']): string {
  return {
    priest: 'الكاهن',
    deacon: 'الشماس',
    people: 'الشعب',
    all: 'الجميع',
  }[role];
}
