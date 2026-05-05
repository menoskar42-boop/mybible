// ── نظام الخرائط الموحّدة للقداسات الثلاثة ──────────────────────────────────
// يربط القسم الواحد (sectionKey) بشرائح من كل قداس بنفس الاسم المنطقي

import { liturgies } from './liturgy-content';

export type LiturgyType = 'basil' | 'gregory' | 'cyril';

export interface LiturgySlide {
  id: string;
  role: 'priest' | 'deacon' | 'people' | 'all';
  title: string;
  text: string;
}

export interface UnifiedSection {
  sectionKey: string;
  label: string;
  icon: string;
  slides: Record<LiturgyType, LiturgySlide[]>;
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

// ── استخراج الشرائح من الخولاجي الموجود
function extractSlides(liturgyId: LiturgyType, chapterIds: string[]): LiturgySlide[] {
  const liturgy = liturgies.find(l => l.id === liturgyId);
  if (!liturgy) return [];
  const slides: LiturgySlide[] = [];
  for (const chapId of chapterIds) {
    const chapter = liturgy.chapters.find(c => c.id === chapId);
    if (!chapter) continue;
    for (const part of chapter.parts) {
      slides.push({
        id: `${liturgyId}-${part.id}`,
        role: normalizeRole(part.role),
        title: part.title,
        text: part.text,
      });
    }
  }
  return slides;
}

// ── الأقسام الموحّدة — ترتيب القداس
export const unifiedSections: UnifiedSection[] = [
  {
    sectionKey: 'intro',
    label: 'الصلوات الافتتاحية',
    icon: '🕊️',
    slides: {
      basil: extractSlides('basil', ['basil-opening']),
      gregory: extractSlides('gregory', ['greg-intro', 'greg-praise']),
      cyril: extractSlides('cyril', ['cyril-intro']),
    },
  },
  {
    sectionKey: 'readings',
    label: 'قراءات الكتاب المقدس',
    icon: '📖',
    slides: {
      basil: extractSlides('basil', ['basil-gospel-readings']),
      gregory: extractSlides('gregory', ['greg-praise']),
      cyril: extractSlides('cyril', ['cyril-penitence']),
    },
  },
  {
    sectionKey: 'repentance',
    label: 'التوبة والصلح',
    icon: '🙏',
    slides: {
      basil: extractSlides('basil', ['basil-repentance', 'basil-reconciliation']),
      gregory: extractSlides('gregory', ['greg-praise']),
      cyril: extractSlides('cyril', ['cyril-penitence']),
    },
  },
  {
    sectionKey: 'anaphora',
    label: 'الأنافورا — القربان',
    icon: '✝️',
    slides: {
      basil: extractSlides('basil', ['basil-anaphora']),
      gregory: extractSlides('gregory', ['greg-anaphora']),
      cyril: extractSlides('cyril', ['cyril-anaphora']),
    },
  },
  {
    sectionKey: 'communion',
    label: 'التناول المقدس',
    icon: '🍷',
    slides: {
      basil: extractSlides('basil', ['basil-communion']),
      gregory: extractSlides('gregory', ['greg-anaphora']),
      cyril: extractSlides('cyril', ['cyril-anaphora']),
    },
  },
  {
    sectionKey: 'ending',
    label: 'الختام والشكر',
    icon: '☮️',
    slides: {
      basil: extractSlides('basil', ['basil-thanksgiving']),
      gregory: extractSlides('gregory', ['greg-closing']),
      cyril: extractSlides('cyril', ['cyril-closing']),
    },
  },
];

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
  sectionKey: 'intro',
  slideIndex: 0,
  deaconOverride: null,
  updatedAt: Date.now(),
};

// ── دوال مساعدة
export function getSlidesForSection(liturgyType: LiturgyType, sectionKey: string): LiturgySlide[] {
  const section = unifiedSections.find(s => s.sectionKey === sectionKey);
  return section?.slides[liturgyType] ?? [];
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
