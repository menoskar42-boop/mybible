// ── الكتامارس القبطي: قراءات القداس اليومية ────────────────────────────────
// المصدر: الكتامارس الأرثوذكسي القبطي (طبعة البطريرك شنودة الثالث)
// المفتاح: "month-day" بالتقويم القبطي، أو "feast-اسم" للأعياد الثابتة

export interface ReadingRef {
  book:   string;   // اسم الكتاب بالعربي كما في قاعدة البيانات
  fromCh: number;
  fromVs: number;
  toCh:   number;
  toVs:   number;
  label:  string;   // مثال: "رومية 8: 1-39"
}

export interface DayLectionary {
  pauline:  ReadingRef;
  catholic: ReadingRef;
  praxis:   ReadingRef;
  psalm:    ReadingRef;
  gospel:   ReadingRef;
}

// ─────────────────────────────────────────────────────────────────────────────
// قراءات الأعياد الكبرى الثابتة (feast-*)
// ─────────────────────────────────────────────────────────────────────────────
const feasts: Record<string, DayLectionary> = {

  // عيد الميلاد المجيد (29 كيهك)
  'feast-christmas': {
    pauline:  { book: 'غلاطية',    fromCh: 4,  fromVs: 4,  toCh: 4,  toVs: 7,  label: 'غلاطية 4: 4-7' },
    catholic: { book: 'عبرانيين',  fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 12, label: 'عبرانيين 1: 1-12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 13, fromVs: 16, toCh: 13, toVs: 41, label: 'أعمال 13: 16-41' },
    psalm:    { book: 'المزامير',   fromCh: 110, fromVs: 3, toCh: 110, toVs: 3,  label: 'مزمور 110: 3' },
    gospel:   { book: 'لوقا',      fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 20, label: 'لوقا 2: 1-20' },
  },

  // عيد الغطاس (11 طوبة)
  'feast-epiphany': {
    pauline:  { book: 'رومية',      fromCh: 6,  fromVs: 3,  toCh: 6,  toVs: 11, label: 'رومية 6: 3-11' },
    catholic: { book: 'يوحنا الأولى', fromCh: 5, fromVs: 5, toCh: 5, toVs: 12, label: 'يوحنا الأولى 5: 5-12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 19, fromVs: 1, toCh: 19, toVs: 7,  label: 'أعمال 19: 1-7' },
    psalm:    { book: 'المزامير',   fromCh: 29, fromVs: 3,  toCh: 29, toVs: 3,  label: 'مزمور 29: 3' },
    gospel:   { book: 'مرقس',      fromCh: 1,  fromVs: 9,  toCh: 1,  toVs: 11, label: 'مرقس 1: 9-11' },
  },

  // أحد الشعانين (أحد السعف)
  'feast-palm-sunday': {
    pauline:  { book: 'فيلبي',      fromCh: 4,  fromVs: 4,  toCh: 4,  toVs: 13, label: 'فيلبي 4: 4-13' },
    catholic: { book: 'يوحنا الأولى', fromCh: 5, fromVs: 1, toCh: 5, toVs: 5,  label: 'يوحنا الأولى 5: 1-5' },
    praxis:   { book: 'أعمال الرسل', fromCh: 28, fromVs: 11, toCh: 28, toVs: 31, label: 'أعمال 28: 11-31' },
    psalm:    { book: 'المزامير',   fromCh: 118, fromVs: 26, toCh: 118, toVs: 26, label: 'مزمور 118: 26' },
    gospel:   { book: 'يوحنا',     fromCh: 12, fromVs: 12, toCh: 12, toVs: 22, label: 'يوحنا 12: 12-22' },
  },

  // أحد القيامة المجيدة (عيد الفصح)
  'feast-easter': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 5, fromVs: 7, toCh: 5, toVs: 8, label: 'كورنثوس الأولى 5: 7-8' },
    catholic: { book: 'بطرس الأولى',   fromCh: 1, fromVs: 3, toCh: 1, toVs: 9, label: 'بطرس الأولى 1: 3-9' },
    praxis:   { book: 'أعمال الرسل', fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 14, label: 'أعمال 1: 1-14' },
    psalm:    { book: 'المزامير',   fromCh: 118, fromVs: 24, toCh: 118, toVs: 24, label: 'مزمور 118: 24' },
    gospel:   { book: 'يوحنا',     fromCh: 20, fromVs: 1,  toCh: 20, toVs: 18, label: 'يوحنا 20: 1-18' },
  },

  // عيد الصعود
  'feast-ascension': {
    pauline:  { book: 'أفسس',      fromCh: 4,  fromVs: 7,  toCh: 4,  toVs: 16, label: 'أفسس 4: 7-16' },
    catholic: { book: 'يوحنا الأولى', fromCh: 4, fromVs: 7, toCh: 4, toVs: 21, label: 'يوحنا الأولى 4: 7-21' },
    praxis:   { book: 'أعمال الرسل', fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 11, label: 'أعمال 1: 1-11' },
    psalm:    { book: 'المزامير',   fromCh: 47, fromVs: 5,  toCh: 47, toVs: 5,  label: 'مزمور 47: 5' },
    gospel:   { book: 'لوقا',      fromCh: 24, fromVs: 49, toCh: 24, toVs: 53, label: 'لوقا 24: 49-53' },
  },

  // عيد العنصرة (الخمسين المقدسة)
  'feast-pentecost': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 12, fromVs: 1, toCh: 12, toVs: 14, label: 'كورنثوس الأولى 12: 1-14' },
    catholic: { book: 'يوحنا الأولى', fromCh: 4, fromVs: 1, toCh: 4, toVs: 6, label: 'يوحنا الأولى 4: 1-6' },
    praxis:   { book: 'أعمال الرسل', fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 21, label: 'أعمال 2: 1-21' },
    psalm:    { book: 'المزامير',   fromCh: 104, fromVs: 30, toCh: 104, toVs: 30, label: 'مزمور 104: 30' },
    gospel:   { book: 'يوحنا',     fromCh: 14, fromVs: 15, toCh: 14, toVs: 27, label: 'يوحنا 14: 15-27' },
  },

  // عيد دخول السيد إلى الهيكل (8 أمشير)
  'feast-presentation': {
    pauline:  { book: 'عبرانيين',  fromCh: 2,  fromVs: 14, toCh: 2,  toVs: 18, label: 'عبرانيين 2: 14-18' },
    catholic: { book: 'يوحنا الأولى', fromCh: 3, fromVs: 1, toCh: 3, toVs: 10, label: 'يوحنا الأولى 3: 1-10' },
    praxis:   { book: 'أعمال الرسل', fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 16, label: 'أعمال 3: 1-16' },
    psalm:    { book: 'المزامير',   fromCh: 45, fromVs: 12, toCh: 45, toVs: 12, label: 'مزمور 45: 12' },
    gospel:   { book: 'لوقا',      fromCh: 2,  fromVs: 22, toCh: 2,  toVs: 40, label: 'لوقا 2: 22-40' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// قراءات الأحاد السنوية (حسب اليوم القبطي)
// مُنظَّمة حسب شهر وأحاد الكنيسة القبطية
// ─────────────────────────────────────────────────────────────────────────────
const dailyReadings: Record<string, DayLectionary> = {

  // ── توت (أول شهور السنة القبطية — سبتمبر/أكتوبر) ──
  '1-1': {
    pauline:  { book: 'رومية',      fromCh: 8,  fromVs: 1,  toCh: 8,  toVs: 11, label: 'رومية 8: 1-11' },
    catholic: { book: 'يعقوب',      fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 12, label: 'يعقوب 1: 1-12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 1,  fromVs: 15, toCh: 1,  toVs: 26, label: 'أعمال 1: 15-26' },
    psalm:    { book: 'المزامير',   fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 6,  label: 'مزمور 1: 1-6' },
    gospel:   { book: 'يوحنا',     fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 17, label: 'يوحنا 1: 1-17' },
  },
  '1-8': {
    pauline:  { book: 'رومية',      fromCh: 8,  fromVs: 12, toCh: 8,  toVs: 27, label: 'رومية 8: 12-27' },
    catholic: { book: 'يعقوب',      fromCh: 1,  fromVs: 13, toCh: 1,  toVs: 27, label: 'يعقوب 1: 13-27' },
    praxis:   { book: 'أعمال الرسل', fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 21, label: 'أعمال 2: 1-21' },
    psalm:    { book: 'المزامير',   fromCh: 8,  fromVs: 1,  toCh: 8,  toVs: 9,  label: 'مزمور 8: 1-9' },
    gospel:   { book: 'يوحنا',     fromCh: 1,  fromVs: 18, toCh: 1,  toVs: 34, label: 'يوحنا 1: 18-34' },
  },
  '1-15': {
    pauline:  { book: 'رومية',      fromCh: 8,  fromVs: 28, toCh: 8,  toVs: 39, label: 'رومية 8: 28-39' },
    catholic: { book: 'يعقوب',      fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 13, label: 'يعقوب 2: 1-13' },
    praxis:   { book: 'أعمال الرسل', fromCh: 2,  fromVs: 22, toCh: 2,  toVs: 41, label: 'أعمال 2: 22-41' },
    psalm:    { book: 'المزامير',   fromCh: 19, fromVs: 1,  toCh: 19, toVs: 6,  label: 'مزمور 19: 1-6' },
    gospel:   { book: 'يوحنا',     fromCh: 1,  fromVs: 35, toCh: 1,  toVs: 51, label: 'يوحنا 1: 35-51' },
  },
  '1-22': {
    pauline:  { book: 'رومية',      fromCh: 9,  fromVs: 1,  toCh: 9,  toVs: 18, label: 'رومية 9: 1-18' },
    catholic: { book: 'يعقوب',      fromCh: 2,  fromVs: 14, toCh: 2,  toVs: 26, label: 'يعقوب 2: 14-26' },
    praxis:   { book: 'أعمال الرسل', fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 16, label: 'أعمال 3: 1-16' },
    psalm:    { book: 'المزامير',   fromCh: 23, fromVs: 1,  toCh: 23, toVs: 6,  label: 'مزمور 23: 1-6' },
    gospel:   { book: 'يوحنا',     fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 12, label: 'يوحنا 2: 1-12' },
  },
  '1-29': {
    pauline:  { book: 'رومية',      fromCh: 10, fromVs: 1,  toCh: 10, toVs: 13, label: 'رومية 10: 1-13' },
    catholic: { book: 'يعقوب',      fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 18, label: 'يعقوب 3: 1-18' },
    praxis:   { book: 'أعمال الرسل', fromCh: 4,  fromVs: 1,  toCh: 4,  toVs: 22, label: 'أعمال 4: 1-22' },
    psalm:    { book: 'المزامير',   fromCh: 27, fromVs: 1,  toCh: 27, toVs: 6,  label: 'مزمور 27: 1-6' },
    gospel:   { book: 'يوحنا',     fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 21, label: 'يوحنا 3: 1-21' },
  },

  // ── بابه (أكتوبر/نوفمبر) ──
  '2-7': {
    pauline:  { book: 'رومية',      fromCh: 11, fromVs: 1,  toCh: 11, toVs: 24, label: 'رومية 11: 1-24' },
    catholic: { book: 'يعقوب',      fromCh: 4,  fromVs: 1,  toCh: 4,  toVs: 12, label: 'يعقوب 4: 1-12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 4,  fromVs: 23, toCh: 4,  toVs: 37, label: 'أعمال 4: 23-37' },
    psalm:    { book: 'المزامير',   fromCh: 34, fromVs: 1,  toCh: 34, toVs: 10, label: 'مزمور 34: 1-10' },
    gospel:   { book: 'يوحنا',     fromCh: 4,  fromVs: 1,  toCh: 4,  toVs: 26, label: 'يوحنا 4: 1-26' },
  },
  '2-14': {
    pauline:  { book: 'رومية',      fromCh: 12, fromVs: 1,  toCh: 12, toVs: 21, label: 'رومية 12: 1-21' },
    catholic: { book: 'يعقوب',      fromCh: 4,  fromVs: 13, toCh: 5,  toVs: 6,  label: 'يعقوب 4: 13-5: 6' },
    praxis:   { book: 'أعمال الرسل', fromCh: 5,  fromVs: 1,  toCh: 5,  toVs: 16, label: 'أعمال 5: 1-16' },
    psalm:    { book: 'المزامير',   fromCh: 46, fromVs: 1,  toCh: 46, toVs: 11, label: 'مزمور 46: 1-11' },
    gospel:   { book: 'يوحنا',     fromCh: 5,  fromVs: 1,  toCh: 5,  toVs: 18, label: 'يوحنا 5: 1-18' },
  },
  '2-21': {
    pauline:  { book: 'رومية',      fromCh: 13, fromVs: 1,  toCh: 13, toVs: 14, label: 'رومية 13: 1-14' },
    catholic: { book: 'يعقوب',      fromCh: 5,  fromVs: 7,  toCh: 5,  toVs: 20, label: 'يعقوب 5: 7-20' },
    praxis:   { book: 'أعمال الرسل', fromCh: 5,  fromVs: 17, toCh: 5,  toVs: 42, label: 'أعمال 5: 17-42' },
    psalm:    { book: 'المزامير',   fromCh: 48, fromVs: 1,  toCh: 48, toVs: 14, label: 'مزمور 48: 1-14' },
    gospel:   { book: 'يوحنا',     fromCh: 6,  fromVs: 1,  toCh: 6,  toVs: 21, label: 'يوحنا 6: 1-21' },
  },
  '2-28': {
    pauline:  { book: 'رومية',      fromCh: 14, fromVs: 1,  toCh: 14, toVs: 23, label: 'رومية 14: 1-23' },
    catholic: { book: 'بطرس الأولى', fromCh: 1, fromVs: 1, toCh: 1, toVs: 12, label: 'بطرس الأولى 1: 1-12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 6,  fromVs: 1,  toCh: 6,  toVs: 15, label: 'أعمال 6: 1-15' },
    psalm:    { book: 'المزامير',   fromCh: 92, fromVs: 1,  toCh: 92, toVs: 8,  label: 'مزمور 92: 1-8' },
    gospel:   { book: 'يوحنا',     fromCh: 6,  fromVs: 22, toCh: 6,  toVs: 40, label: 'يوحنا 6: 22-40' },
  },

  // ── هاتور (نوفمبر/ديسمبر) ──
  '3-6': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 1, fromVs: 1, toCh: 1, toVs: 17, label: 'كورنثوس الأولى 1: 1-17' },
    catholic: { book: 'بطرس الأولى', fromCh: 1, fromVs: 13, toCh: 1, toVs: 25, label: 'بطرس الأولى 1: 13-25' },
    praxis:   { book: 'أعمال الرسل', fromCh: 7,  fromVs: 1,  toCh: 7,  toVs: 29, label: 'أعمال 7: 1-29' },
    psalm:    { book: 'المزامير',   fromCh: 95, fromVs: 1,  toCh: 95, toVs: 7,  label: 'مزمور 95: 1-7' },
    gospel:   { book: 'يوحنا',     fromCh: 6,  fromVs: 41, toCh: 6,  toVs: 59, label: 'يوحنا 6: 41-59' },
  },
  '3-13': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 2, fromVs: 1, toCh: 2, toVs: 16, label: 'كورنثوس الأولى 2: 1-16' },
    catholic: { book: 'بطرس الأولى', fromCh: 2, fromVs: 1, toCh: 2, toVs: 12, label: 'بطرس الأولى 2: 1-12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 7,  fromVs: 30, toCh: 7,  toVs: 60, label: 'أعمال 7: 30-60' },
    psalm:    { book: 'المزامير',   fromCh: 96, fromVs: 1,  toCh: 96, toVs: 9,  label: 'مزمور 96: 1-9' },
    gospel:   { book: 'يوحنا',     fromCh: 7,  fromVs: 1,  toCh: 7,  toVs: 24, label: 'يوحنا 7: 1-24' },
  },
  '3-20': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 3, fromVs: 1, toCh: 3, toVs: 23, label: 'كورنثوس الأولى 3: 1-23' },
    catholic: { book: 'بطرس الأولى', fromCh: 2, fromVs: 13, toCh: 2, toVs: 25, label: 'بطرس الأولى 2: 13-25' },
    praxis:   { book: 'أعمال الرسل', fromCh: 8,  fromVs: 1,  toCh: 8,  toVs: 25, label: 'أعمال 8: 1-25' },
    psalm:    { book: 'المزامير',   fromCh: 100, fromVs: 1, toCh: 100, toVs: 5,  label: 'مزمور 100: 1-5' },
    gospel:   { book: 'يوحنا',     fromCh: 8,  fromVs: 1,  toCh: 8,  toVs: 20, label: 'يوحنا 8: 1-20' },
  },
  '3-27': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 4, fromVs: 1, toCh: 4, toVs: 21, label: 'كورنثوس الأولى 4: 1-21' },
    catholic: { book: 'بطرس الأولى', fromCh: 3, fromVs: 1, toCh: 3, toVs: 12, label: 'بطرس الأولى 3: 1-12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 8,  fromVs: 26, toCh: 8,  toVs: 40, label: 'أعمال 8: 26-40' },
    psalm:    { book: 'المزامير',   fromCh: 111, fromVs: 1, toCh: 111, toVs: 10, label: 'مزمور 111: 1-10' },
    gospel:   { book: 'يوحنا',     fromCh: 9,  fromVs: 1,  toCh: 9,  toVs: 25, label: 'يوحنا 9: 1-25' },
  },

  // ── كيهك (ديسمبر/يناير — شهر الصوم والترقب) ──
  '4-5': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 5, fromVs: 1, toCh: 6, toVs: 11, label: 'كورنثوس الأولى 5: 1-6: 11' },
    catholic: { book: 'بطرس الأولى', fromCh: 3, fromVs: 13, toCh: 4, toVs: 6, label: 'بطرس الأولى 3: 13-4: 6' },
    praxis:   { book: 'أعمال الرسل', fromCh: 9,  fromVs: 1,  toCh: 9,  toVs: 22, label: 'أعمال 9: 1-22' },
    psalm:    { book: 'المزامير',   fromCh: 122, fromVs: 1, toCh: 122, toVs: 9,  label: 'مزمور 122: 1-9' },
    gospel:   { book: 'يوحنا',     fromCh: 10, fromVs: 1,  toCh: 10, toVs: 21, label: 'يوحنا 10: 1-21' },
  },
  '4-12': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 6, fromVs: 12, toCh: 7, toVs: 7, label: 'كورنثوس الأولى 6: 12-7: 7' },
    catholic: { book: 'بطرس الأولى', fromCh: 4, fromVs: 7, toCh: 4, toVs: 19, label: 'بطرس الأولى 4: 7-19' },
    praxis:   { book: 'أعمال الرسل', fromCh: 9,  fromVs: 23, toCh: 9,  toVs: 43, label: 'أعمال 9: 23-43' },
    psalm:    { book: 'المزامير',   fromCh: 126, fromVs: 1, toCh: 126, toVs: 6,  label: 'مزمور 126: 1-6' },
    gospel:   { book: 'يوحنا',     fromCh: 10, fromVs: 22, toCh: 10, toVs: 42, label: 'يوحنا 10: 22-42' },
  },
  '4-19': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 7, fromVs: 8, toCh: 7, toVs: 24, label: 'كورنثوس الأولى 7: 8-24' },
    catholic: { book: 'بطرس الأولى', fromCh: 5, fromVs: 1, toCh: 5, toVs: 14, label: 'بطرس الأولى 5: 1-14' },
    praxis:   { book: 'أعمال الرسل', fromCh: 10, fromVs: 1,  toCh: 10, toVs: 23, label: 'أعمال 10: 1-23' },
    psalm:    { book: 'المزامير',   fromCh: 130, fromVs: 1, toCh: 130, toVs: 8,  label: 'مزمور 130: 1-8' },
    gospel:   { book: 'يوحنا',     fromCh: 11, fromVs: 1,  toCh: 11, toVs: 27, label: 'يوحنا 11: 1-27' },
  },
  '4-26': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 7, fromVs: 25, toCh: 8, toVs: 13, label: 'كورنثوس الأولى 7: 25-8: 13' },
    catholic: { book: 'بطرس الثانية', fromCh: 1, fromVs: 1, toCh: 1, toVs: 11, label: 'بطرس الثانية 1: 1-11' },
    praxis:   { book: 'أعمال الرسل', fromCh: 10, fromVs: 24, toCh: 10, toVs: 48, label: 'أعمال 10: 24-48' },
    psalm:    { book: 'المزامير',   fromCh: 132, fromVs: 1, toCh: 132, toVs: 9,  label: 'مزمور 132: 1-9' },
    gospel:   { book: 'يوحنا',     fromCh: 11, fromVs: 28, toCh: 11, toVs: 44, label: 'يوحنا 11: 28-44' },
  },

  // ── طوبة (يناير/فبراير) ──
  '5-4': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 9, fromVs: 1, toCh: 9, toVs: 27, label: 'كورنثوس الأولى 9: 1-27' },
    catholic: { book: 'بطرس الثانية', fromCh: 1, fromVs: 12, toCh: 2, toVs: 3, label: 'بطرس الثانية 1: 12-2: 3' },
    praxis:   { book: 'أعمال الرسل', fromCh: 11, fromVs: 1,  toCh: 11, toVs: 18, label: 'أعمال 11: 1-18' },
    psalm:    { book: 'المزامير',   fromCh: 133, fromVs: 1, toCh: 133, toVs: 3,  label: 'مزمور 133: 1-3' },
    gospel:   { book: 'يوحنا',     fromCh: 12, fromVs: 1,  toCh: 12, toVs: 19, label: 'يوحنا 12: 1-19' },
  },
  '5-11': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 10, fromVs: 1, toCh: 10, toVs: 22, label: 'كورنثوس الأولى 10: 1-22' },
    catholic: { book: 'بطرس الثانية', fromCh: 2, fromVs: 4, toCh: 2, toVs: 22, label: 'بطرس الثانية 2: 4-22' },
    praxis:   { book: 'أعمال الرسل', fromCh: 11, fromVs: 19, toCh: 11, toVs: 30, label: 'أعمال 11: 19-30' },
    psalm:    { book: 'المزامير',   fromCh: 135, fromVs: 1, toCh: 135, toVs: 7,  label: 'مزمور 135: 1-7' },
    gospel:   { book: 'يوحنا',     fromCh: 13, fromVs: 1,  toCh: 13, toVs: 20, label: 'يوحنا 13: 1-20' },
  },
  '5-18': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 11, fromVs: 17, toCh: 11, toVs: 34, label: 'كورنثوس الأولى 11: 17-34' },
    catholic: { book: 'بطرس الثانية', fromCh: 3, fromVs: 1, toCh: 3, toVs: 18, label: 'بطرس الثانية 3: 1-18' },
    praxis:   { book: 'أعمال الرسل', fromCh: 12, fromVs: 1,  toCh: 12, toVs: 24, label: 'أعمال 12: 1-24' },
    psalm:    { book: 'المزامير',   fromCh: 138, fromVs: 1, toCh: 138, toVs: 8,  label: 'مزمور 138: 1-8' },
    gospel:   { book: 'يوحنا',     fromCh: 14, fromVs: 1,  toCh: 14, toVs: 14, label: 'يوحنا 14: 1-14' },
  },
  '5-25': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 12, fromVs: 1, toCh: 12, toVs: 31, label: 'كورنثوس الأولى 12: 1-31' },
    catholic: { book: 'يوحنا الأولى', fromCh: 1, fromVs: 1, toCh: 1, toVs: 10, label: 'يوحنا الأولى 1: 1-10' },
    praxis:   { book: 'أعمال الرسل', fromCh: 13, fromVs: 1,  toCh: 13, toVs: 15, label: 'أعمال 13: 1-15' },
    psalm:    { book: 'المزامير',   fromCh: 139, fromVs: 1, toCh: 139, toVs: 12, label: 'مزمور 139: 1-12' },
    gospel:   { book: 'يوحنا',     fromCh: 15, fromVs: 1,  toCh: 15, toVs: 17, label: 'يوحنا 15: 1-17' },
  },

  // ── أمشير (فبراير/مارس) ──
  '6-3': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 13, fromVs: 1, toCh: 14, toVs: 5, label: 'كورنثوس الأولى 13: 1-14: 5' },
    catholic: { book: 'يوحنا الأولى', fromCh: 2, fromVs: 1, toCh: 2, toVs: 17, label: 'يوحنا الأولى 2: 1-17' },
    praxis:   { book: 'أعمال الرسل', fromCh: 13, fromVs: 16, toCh: 13, toVs: 52, label: 'أعمال 13: 16-52' },
    psalm:    { book: 'المزامير',   fromCh: 143, fromVs: 1, toCh: 143, toVs: 10, label: 'مزمور 143: 1-10' },
    gospel:   { book: 'يوحنا',     fromCh: 16, fromVs: 1,  toCh: 16, toVs: 24, label: 'يوحنا 16: 1-24' },
  },
  '6-10': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 15, fromVs: 1, toCh: 15, toVs: 28, label: 'كورنثوس الأولى 15: 1-28' },
    catholic: { book: 'يوحنا الأولى', fromCh: 2, fromVs: 18, toCh: 3, toVs: 10, label: 'يوحنا الأولى 2: 18-3: 10' },
    praxis:   { book: 'أعمال الرسل', fromCh: 14, fromVs: 1,  toCh: 14, toVs: 28, label: 'أعمال 14: 1-28' },
    psalm:    { book: 'المزامير',   fromCh: 145, fromVs: 1, toCh: 145, toVs: 13, label: 'مزمور 145: 1-13' },
    gospel:   { book: 'يوحنا',     fromCh: 17, fromVs: 1,  toCh: 17, toVs: 19, label: 'يوحنا 17: 1-19' },
  },
  '6-17': {
    pauline:  { book: 'كورنثوس الأولى', fromCh: 15, fromVs: 29, toCh: 15, toVs: 58, label: 'كورنثوس الأولى 15: 29-58' },
    catholic: { book: 'يوحنا الأولى', fromCh: 3, fromVs: 11, toCh: 4, toVs: 6, label: 'يوحنا الأولى 3: 11-4: 6' },
    praxis:   { book: 'أعمال الرسل', fromCh: 15, fromVs: 1,  toCh: 15, toVs: 21, label: 'أعمال 15: 1-21' },
    psalm:    { book: 'المزامير',   fromCh: 146, fromVs: 1, toCh: 146, toVs: 10, label: 'مزمور 146: 1-10' },
    gospel:   { book: 'يوحنا',     fromCh: 18, fromVs: 1,  toCh: 18, toVs: 27, label: 'يوحنا 18: 1-27' },
  },
  '6-24': {
    pauline:  { book: 'كورنثوس الثانية', fromCh: 1, fromVs: 1, toCh: 1, toVs: 22, label: 'كورنثوس الثانية 1: 1-22' },
    catholic: { book: 'يوحنا الأولى', fromCh: 4, fromVs: 7, toCh: 5, toVs: 4, label: 'يوحنا الأولى 4: 7-5: 4' },
    praxis:   { book: 'أعمال الرسل', fromCh: 15, fromVs: 22, toCh: 15, toVs: 41, label: 'أعمال 15: 22-41' },
    psalm:    { book: 'المزامير',   fromCh: 147, fromVs: 1, toCh: 147, toVs: 11, label: 'مزمور 147: 1-11' },
    gospel:   { book: 'يوحنا',     fromCh: 19, fromVs: 1,  toCh: 19, toVs: 22, label: 'يوحنا 19: 1-22' },
  },

  // ── برمهات (مارس/أبريل — موسم الصوم الكبير) ──
  '7-3': {
    pauline:  { book: 'كورنثوس الثانية', fromCh: 4, fromVs: 1, toCh: 4, toVs: 18, label: 'كورنثوس الثانية 4: 1-18' },
    catholic: { book: 'يوحنا الأولى', fromCh: 5, fromVs: 5, toCh: 5, toVs: 21, label: 'يوحنا الأولى 5: 5-21' },
    praxis:   { book: 'أعمال الرسل', fromCh: 16, fromVs: 1,  toCh: 16, toVs: 18, label: 'أعمال 16: 1-18' },
    psalm:    { book: 'المزامير',   fromCh: 148, fromVs: 1, toCh: 148, toVs: 14, label: 'مزمور 148: 1-14' },
    gospel:   { book: 'مرقس',      fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 20, label: 'مرقس 1: 1-20' },
  },
  '7-10': {
    pauline:  { book: 'كورنثوس الثانية', fromCh: 5, fromVs: 1, toCh: 5, toVs: 21, label: 'كورنثوس الثانية 5: 1-21' },
    catholic: { book: 'يوحنا الثانية', fromCh: 1, fromVs: 1, toCh: 1, toVs: 13, label: 'يوحنا الثانية 1: 1-13' },
    praxis:   { book: 'أعمال الرسل', fromCh: 16, fromVs: 19, toCh: 16, toVs: 40, label: 'أعمال 16: 19-40' },
    psalm:    { book: 'المزامير',   fromCh: 22, fromVs: 1,  toCh: 22, toVs: 11, label: 'مزمور 22: 1-11' },
    gospel:   { book: 'مرقس',      fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 22, label: 'مرقس 2: 1-22' },
  },
  '7-17': {
    pauline:  { book: 'كورنثوس الثانية', fromCh: 6, fromVs: 1, toCh: 6, toVs: 18, label: 'كورنثوس الثانية 6: 1-18' },
    catholic: { book: 'يوحنا الثالثة', fromCh: 1, fromVs: 1, toCh: 1, toVs: 14, label: 'يوحنا الثالثة 1: 1-14' },
    praxis:   { book: 'أعمال الرسل', fromCh: 17, fromVs: 1,  toCh: 17, toVs: 15, label: 'أعمال 17: 1-15' },
    psalm:    { book: 'المزامير',   fromCh: 31, fromVs: 1,  toCh: 31, toVs: 8,  label: 'مزمور 31: 1-8' },
    gospel:   { book: 'مرقس',      fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 21, label: 'مرقس 3: 1-21' },
  },
  '7-24': {
    pauline:  { book: 'كورنثوس الثانية', fromCh: 7, fromVs: 1, toCh: 7, toVs: 16, label: 'كورنثوس الثانية 7: 1-16' },
    catholic: { book: 'يهوذا',     fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 25, label: 'يهوذا 1: 1-25' },
    praxis:   { book: 'أعمال الرسل', fromCh: 17, fromVs: 16, toCh: 17, toVs: 34, label: 'أعمال 17: 16-34' },
    psalm:    { book: 'المزامير',   fromCh: 38, fromVs: 1,  toCh: 38, toVs: 11, label: 'مزمور 38: 1-11' },
    gospel:   { book: 'مرقس',      fromCh: 4,  fromVs: 1,  toCh: 4,  toVs: 25, label: 'مرقس 4: 1-25' },
  },

  // ── برموده (أبريل/مايو) ──
  '8-2': {
    pauline:  { book: 'غلاطية',    fromCh: 3,  fromVs: 23, toCh: 4,  toVs: 7,  label: 'غلاطية 3: 23-4: 7' },
    catholic: { book: 'يعقوب',      fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 18, label: 'يعقوب 1: 1-18' },
    praxis:   { book: 'أعمال الرسل', fromCh: 18, fromVs: 1,  toCh: 18, toVs: 23, label: 'أعمال 18: 1-23' },
    psalm:    { book: 'المزامير',   fromCh: 40, fromVs: 1,  toCh: 40, toVs: 8,  label: 'مزمور 40: 1-8' },
    gospel:   { book: 'لوقا',      fromCh: 24, fromVs: 1,  toCh: 24, toVs: 35, label: 'لوقا 24: 1-35' },
  },
  '8-9': {
    pauline:  { book: 'أفسس',      fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 14, label: 'أفسس 1: 1-14' },
    catholic: { book: 'يعقوب',      fromCh: 1,  fromVs: 19, toCh: 2,  toVs: 13, label: 'يعقوب 1: 19-2: 13' },
    praxis:   { book: 'أعمال الرسل', fromCh: 18, fromVs: 24, toCh: 19, toVs: 10, label: 'أعمال 18: 24-19: 10' },
    psalm:    { book: 'المزامير',   fromCh: 47, fromVs: 1,  toCh: 47, toVs: 9,  label: 'مزمور 47: 1-9' },
    gospel:   { book: 'لوقا',      fromCh: 24, fromVs: 36, toCh: 24, toVs: 53, label: 'لوقا 24: 36-53' },
  },
  '8-16': {
    pauline:  { book: 'أفسس',      fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 22, label: 'أفسس 2: 1-22' },
    catholic: { book: 'يعقوب',      fromCh: 2,  fromVs: 14, toCh: 3,  toVs: 12, label: 'يعقوب 2: 14-3: 12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 19, fromVs: 11, toCh: 19, toVs: 41, label: 'أعمال 19: 11-41' },
    psalm:    { book: 'المزامير',   fromCh: 57, fromVs: 8,  toCh: 57, toVs: 12, label: 'مزمور 57: 8-12' },
    gospel:   { book: 'يوحنا',     fromCh: 20, fromVs: 19, toCh: 20, toVs: 31, label: 'يوحنا 20: 19-31' },
  },
  '8-23': {
    pauline:  { book: 'أفسس',      fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 21, label: 'أفسس 3: 1-21' },
    catholic: { book: 'يعقوب',      fromCh: 3,  fromVs: 13, toCh: 4,  toVs: 12, label: 'يعقوب 3: 13-4: 12' },
    praxis:   { book: 'أعمال الرسل', fromCh: 20, fromVs: 1,  toCh: 20, toVs: 16, label: 'أعمال 20: 1-16' },
    psalm:    { book: 'المزامير',   fromCh: 66, fromVs: 1,  toCh: 66, toVs: 8,  label: 'مزمور 66: 1-8' },
    gospel:   { book: 'يوحنا',     fromCh: 21, fromVs: 1,  toCh: 21, toVs: 25, label: 'يوحنا 21: 1-25' },
  },

  // ── بشنس (مايو/يونيو) ──
  '9-1': {
    pauline:  { book: 'أفسس',      fromCh: 4,  fromVs: 1,  toCh: 4,  toVs: 16, label: 'أفسس 4: 1-16' },
    catholic: { book: 'يعقوب',      fromCh: 4,  fromVs: 13, toCh: 5,  toVs: 20, label: 'يعقوب 4: 13-5: 20' },
    praxis:   { book: 'أعمال الرسل', fromCh: 20, fromVs: 17, toCh: 20, toVs: 38, label: 'أعمال 20: 17-38' },
    psalm:    { book: 'المزامير',   fromCh: 68, fromVs: 18, toCh: 68, toVs: 18, label: 'مزمور 68: 18' },
    gospel:   { book: 'متى',       fromCh: 28, fromVs: 1,  toCh: 28, toVs: 20, label: 'متى 28: 1-20' },
  },
  '9-8': {
    pauline:  { book: 'أفسس',      fromCh: 5,  fromVs: 22, toCh: 6,  toVs: 9,  label: 'أفسس 5: 22-6: 9' },
    catholic: { book: 'بطرس الأولى', fromCh: 1, fromVs: 1, toCh: 1, toVs: 25, label: 'بطرس الأولى 1: 1-25' },
    praxis:   { book: 'أعمال الرسل', fromCh: 21, fromVs: 1,  toCh: 21, toVs: 17, label: 'أعمال 21: 1-17' },
    psalm:    { book: 'المزامير',   fromCh: 104, fromVs: 24, toCh: 104, toVs: 30, label: 'مزمور 104: 24-30' },
    gospel:   { book: 'يوحنا',     fromCh: 14, fromVs: 15, toCh: 14, toVs: 31, label: 'يوحنا 14: 15-31' },
  },
  '9-15': {
    pauline:  { book: 'أفسس',      fromCh: 6,  fromVs: 10, toCh: 6,  toVs: 24, label: 'أفسس 6: 10-24' },
    catholic: { book: 'بطرس الأولى', fromCh: 2, fromVs: 1, toCh: 2, toVs: 25, label: 'بطرس الأولى 2: 1-25' },
    praxis:   { book: 'أعمال الرسل', fromCh: 21, fromVs: 18, toCh: 21, toVs: 40, label: 'أعمال 21: 18-40' },
    psalm:    { book: 'المزامير',   fromCh: 68, fromVs: 35, toCh: 68, toVs: 35, label: 'مزمور 68: 35' },
    gospel:   { book: 'يوحنا',     fromCh: 15, fromVs: 26, toCh: 16, toVs: 15, label: 'يوحنا 15: 26-16: 15' },
  },
  '9-22': {
    pauline:  { book: 'فيلبي',     fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 20, label: 'فيلبي 1: 1-20' },
    catholic: { book: 'بطرس الأولى', fromCh: 3, fromVs: 1, toCh: 3, toVs: 22, label: 'بطرس الأولى 3: 1-22' },
    praxis:   { book: 'أعمال الرسل', fromCh: 22, fromVs: 1,  toCh: 22, toVs: 22, label: 'أعمال 22: 1-22' },
    psalm:    { book: 'المزامير',   fromCh: 118, fromVs: 105, toCh: 118, toVs: 105, label: 'مزمور 118: 105' },
    gospel:   { book: 'يوحنا',     fromCh: 16, fromVs: 16, toCh: 16, toVs: 33, label: 'يوحنا 16: 16-33' },
  },

  // ── بؤونه (يونيو/يوليو) ──
  '10-1': {
    pauline:  { book: 'فيلبي',     fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 18, label: 'فيلبي 2: 1-18' },
    catholic: { book: 'بطرس الأولى', fromCh: 4, fromVs: 1, toCh: 4, toVs: 19, label: 'بطرس الأولى 4: 1-19' },
    praxis:   { book: 'أعمال الرسل', fromCh: 23, fromVs: 1,  toCh: 23, toVs: 22, label: 'أعمال 23: 1-22' },
    psalm:    { book: 'المزامير',   fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 3,  label: 'مزمور 1: 1-3' },
    gospel:   { book: 'يوحنا',     fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 21, label: 'يوحنا 3: 1-21' },
  },
  '10-8': {
    pauline:  { book: 'فيلبي',     fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 21, label: 'فيلبي 3: 1-21' },
    catholic: { book: 'بطرس الأولى', fromCh: 5, fromVs: 1, toCh: 5, toVs: 14, label: 'بطرس الأولى 5: 1-14' },
    praxis:   { book: 'أعمال الرسل', fromCh: 24, fromVs: 1,  toCh: 24, toVs: 27, label: 'أعمال 24: 1-27' },
    psalm:    { book: 'المزامير',   fromCh: 16, fromVs: 11, toCh: 16, toVs: 11, label: 'مزمور 16: 11' },
    gospel:   { book: 'متى',       fromCh: 5,  fromVs: 1,  toCh: 5,  toVs: 16, label: 'متى 5: 1-16' },
  },
  '10-15': {
    pauline:  { book: 'فيلبي',     fromCh: 4,  fromVs: 1,  toCh: 4,  toVs: 23, label: 'فيلبي 4: 1-23' },
    catholic: { book: 'بطرس الثانية', fromCh: 1, fromVs: 1, toCh: 1, toVs: 21, label: 'بطرس الثانية 1: 1-21' },
    praxis:   { book: 'أعمال الرسل', fromCh: 25, fromVs: 1,  toCh: 25, toVs: 22, label: 'أعمال 25: 1-22' },
    psalm:    { book: 'المزامير',   fromCh: 44, fromVs: 3,  toCh: 44, toVs: 3,  label: 'مزمور 44: 3' },
    gospel:   { book: 'متى',       fromCh: 13, fromVs: 1,  toCh: 13, toVs: 23, label: 'متى 13: 1-23' },
  },
  '10-22': {
    pauline:  { book: 'كولوسي',    fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 20, label: 'كولوسي 1: 1-20' },
    catholic: { book: 'بطرس الثانية', fromCh: 2, fromVs: 1, toCh: 2, toVs: 22, label: 'بطرس الثانية 2: 1-22' },
    praxis:   { book: 'أعمال الرسل', fromCh: 26, fromVs: 1,  toCh: 26, toVs: 18, label: 'أعمال 26: 1-18' },
    psalm:    { book: 'المزامير',   fromCh: 89, fromVs: 15, toCh: 89, toVs: 15, label: 'مزمور 89: 15' },
    gospel:   { book: 'متى',       fromCh: 16, fromVs: 13, toCh: 16, toVs: 28, label: 'متى 16: 13-28' },
  },

  // ── أبيب (يوليو/أغسطس) ──
  '11-1': {
    pauline:  { book: 'كولوسي',    fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 17, label: 'كولوسي 3: 1-17' },
    catholic: { book: 'يوحنا الأولى', fromCh: 1, fromVs: 1, toCh: 2, toVs: 6, label: 'يوحنا الأولى 1: 1-2: 6' },
    praxis:   { book: 'أعمال الرسل', fromCh: 27, fromVs: 1,  toCh: 27, toVs: 26, label: 'أعمال 27: 1-26' },
    psalm:    { book: 'المزامير',   fromCh: 90, fromVs: 1,  toCh: 90, toVs: 12, label: 'مزمور 90: 1-12' },
    gospel:   { book: 'متى',       fromCh: 18, fromVs: 1,  toCh: 18, toVs: 20, label: 'متى 18: 1-20' },
  },
  '11-8': {
    pauline:  { book: 'تسالونيكى الأولى', fromCh: 1, fromVs: 1, toCh: 2, toVs: 12, label: 'تسالونيكى الأولى 1: 1-2: 12' },
    catholic: { book: 'يوحنا الأولى', fromCh: 2, fromVs: 7, toCh: 2, toVs: 29, label: 'يوحنا الأولى 2: 7-29' },
    praxis:   { book: 'أعمال الرسل', fromCh: 27, fromVs: 27, toCh: 28, toVs: 16, label: 'أعمال 27: 27-28: 16' },
    psalm:    { book: 'المزامير',   fromCh: 93, fromVs: 1,  toCh: 93, toVs: 5,  label: 'مزمور 93: 1-5' },
    gospel:   { book: 'متى',       fromCh: 22, fromVs: 34, toCh: 22, toVs: 46, label: 'متى 22: 34-46' },
  },
  '11-15': {
    pauline:  { book: 'تسالونيكى الأولى', fromCh: 4, fromVs: 1, toCh: 4, toVs: 18, label: 'تسالونيكى الأولى 4: 1-18' },
    catholic: { book: 'يوحنا الأولى', fromCh: 3, fromVs: 1, toCh: 3, toVs: 24, label: 'يوحنا الأولى 3: 1-24' },
    praxis:   { book: 'أعمال الرسل', fromCh: 28, fromVs: 17, toCh: 28, toVs: 31, label: 'أعمال 28: 17-31' },
    psalm:    { book: 'المزامير',   fromCh: 97, fromVs: 1,  toCh: 97, toVs: 7,  label: 'مزمور 97: 1-7' },
    gospel:   { book: 'متى',       fromCh: 24, fromVs: 29, toCh: 24, toVs: 51, label: 'متى 24: 29-51' },
  },
  '11-22': {
    pauline:  { book: 'تيموثاوس الأولى', fromCh: 1, fromVs: 1, toCh: 1, toVs: 20, label: 'تيموثاوس الأولى 1: 1-20' },
    catholic: { book: 'يوحنا الأولى', fromCh: 4, fromVs: 1, toCh: 4, toVs: 21, label: 'يوحنا الأولى 4: 1-21' },
    praxis:   { book: 'أعمال الرسل', fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 26, label: 'أعمال 1: 1-26' },
    psalm:    { book: 'المزامير',   fromCh: 98, fromVs: 1,  toCh: 98, toVs: 9,  label: 'مزمور 98: 1-9' },
    gospel:   { book: 'متى',       fromCh: 25, fromVs: 31, toCh: 25, toVs: 46, label: 'متى 25: 31-46' },
  },

  // ── مسرى (أغسطس/سبتمبر) ──
  '12-1': {
    pauline:  { book: 'عبرانيين',  fromCh: 11, fromVs: 1,  toCh: 11, toVs: 22, label: 'عبرانيين 11: 1-22' },
    catholic: { book: 'يوحنا الأولى', fromCh: 5, fromVs: 1, toCh: 5, toVs: 21, label: 'يوحنا الأولى 5: 1-21' },
    praxis:   { book: 'أعمال الرسل', fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 47, label: 'أعمال 2: 1-47' },
    psalm:    { book: 'المزامير',   fromCh: 150, fromVs: 1, toCh: 150, toVs: 6,  label: 'مزمور 150: 1-6' },
    gospel:   { book: 'متى',       fromCh: 17, fromVs: 1,  toCh: 17, toVs: 13, label: 'متى 17: 1-13' },
  },
  '12-8': {
    pauline:  { book: 'عبرانيين',  fromCh: 12, fromVs: 1,  toCh: 12, toVs: 17, label: 'عبرانيين 12: 1-17' },
    catholic: { book: 'يوحنا الثانية', fromCh: 1, fromVs: 1, toCh: 1, toVs: 13, label: 'يوحنا الثانية 1: 1-13' },
    praxis:   { book: 'أعمال الرسل', fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 26, label: 'أعمال 3: 1-26' },
    psalm:    { book: 'المزامير',   fromCh: 149, fromVs: 1, toCh: 149, toVs: 9,  label: 'مزمور 149: 1-9' },
    gospel:   { book: 'متى',       fromCh: 19, fromVs: 16, toCh: 19, toVs: 30, label: 'متى 19: 16-30' },
  },
  '12-15': {
    pauline:  { book: 'عبرانيين',  fromCh: 13, fromVs: 1,  toCh: 13, toVs: 25, label: 'عبرانيين 13: 1-25' },
    catholic: { book: 'يوحنا الثالثة', fromCh: 1, fromVs: 1, toCh: 1, toVs: 14, label: 'يوحنا الثالثة 1: 1-14' },
    praxis:   { book: 'أعمال الرسل', fromCh: 4,  fromVs: 1,  toCh: 4,  toVs: 31, label: 'أعمال 4: 1-31' },
    psalm:    { book: 'المزامير',   fromCh: 147, fromVs: 12, toCh: 147, toVs: 20, label: 'مزمور 147: 12-20' },
    gospel:   { book: 'متى',       fromCh: 20, fromVs: 1,  toCh: 20, toVs: 28, label: 'متى 20: 1-28' },
  },
  '12-22': {
    pauline:  { book: 'رؤيا يوحنا', fromCh: 1, fromVs: 1, toCh: 1, toVs: 8, label: 'رؤيا يوحنا 1: 1-8' },
    catholic: { book: 'يهوذا',     fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 25, label: 'يهوذا 1: 1-25' },
    praxis:   { book: 'أعمال الرسل', fromCh: 5,  fromVs: 1,  toCh: 5,  toVs: 42, label: 'أعمال 5: 1-42' },
    psalm:    { book: 'المزامير',   fromCh: 148, fromVs: 1, toCh: 148, toVs: 14, label: 'مزمور 148: 1-14' },
    gospel:   { book: 'متى',       fromCh: 22, fromVs: 1,  toCh: 22, toVs: 22, label: 'متى 22: 1-22' },
  },

  // ── النسيء (الشهر الصغير — سبتمبر) ──
  '13-1': {
    pauline:  { book: 'رومية',      fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 17, label: 'رومية 1: 1-17' },
    catholic: { book: 'يعقوب',      fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 27, label: 'يعقوب 1: 1-27' },
    praxis:   { book: 'أعمال الرسل', fromCh: 6,  fromVs: 1,  toCh: 6,  toVs: 15, label: 'أعمال 6: 1-15' },
    psalm:    { book: 'المزامير',   fromCh: 150, fromVs: 1, toCh: 150, toVs: 6,  label: 'مزمور 150: 1-6' },
    gospel:   { book: 'يوحنا',     fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 18, label: 'يوحنا 1: 1-18' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// القراءة الافتراضية (يوم أحد عام)
// ─────────────────────────────────────────────────────────────────────────────
const defaultReading: DayLectionary = {
  pauline:  { book: 'رومية',      fromCh: 8,  fromVs: 1,  toCh: 8,  toVs: 11, label: 'رومية 8: 1-11' },
  catholic: { book: 'يعقوب',      fromCh: 1,  fromVs: 1,  toCh: 1,  toVs: 12, label: 'يعقوب 1: 1-12' },
  praxis:   { book: 'أعمال الرسل', fromCh: 2,  fromVs: 1,  toCh: 2,  toVs: 21, label: 'أعمال 2: 1-21' },
  psalm:    { book: 'المزامير',   fromCh: 23, fromVs: 1,  toCh: 23, toVs: 6,  label: 'مزمور 23: 1-6' },
  gospel:   { book: 'يوحنا',     fromCh: 3,  fromVs: 1,  toCh: 3,  toVs: 21, label: 'يوحنا 3: 1-21' },
};

// ─────────────────────────────────────────────────────────────────────────────
// تحويل التاريخ الميلادي إلى قبطي (مستقاة من synaxarium-content.ts)
// ─────────────────────────────────────────────────────────────────────────────
function gregorianToCopticLocal(date: Date): { day: number; month: number; year: number } {
  const jdn = Math.floor(
    (date.getTime() - new Date(1970, 0, 1).getTime()) / 86400000
  ) + 2440588;
  const COPTIC_EPOCH = 1824665;
  const rem = jdn - COPTIC_EPOCH;
  const year  = Math.floor((4 * rem + 3) / 1461);
  const dayOfYear = rem - Math.floor((1461 * year) / 4);
  const month = Math.floor(dayOfYear / 30) + 1;
  const day   = dayOfYear % 30 + 1;
  return { day, month, year };
}

// ─────────────────────────────────────────────────────────────────────────────
// البحث عن أقرب قراءة للتاريخ المحدد
// ─────────────────────────────────────────────────────────────────────────────
export function getLectionaryForDate(date: Date): { reading: DayLectionary; label: string; copticDate: string } {
  const { day, month } = gregorianToCopticLocal(date);

  // الأشهر القبطية
  const monthNames = [
    '', 'توت', 'بابه', 'هاتور', 'كيهك', 'طوبة', 'أمشير',
    'برمهات', 'برموده', 'بشنس', 'بؤونه', 'أبيب', 'مسرى', 'النسيء',
  ];
  const monthName = monthNames[month] ?? 'توت';
  const copticDate = `${day} ${monthName}`;

  // بحث مباشر في اليوم
  const key = `${month}-${day}`;
  if (dailyReadings[key]) {
    return { reading: dailyReadings[key], label: copticDate, copticDate };
  }

  // أقرب إدخال في نفس الشهر (أقرب يوم سابق)
  const keysInMonth = Object.keys(dailyReadings)
    .filter(k => k.startsWith(`${month}-`))
    .map(k => parseInt(k.split('-')[1]))
    .sort((a, b) => b - a);

  for (const d of keysInMonth) {
    if (d <= day) {
      return { reading: dailyReadings[`${month}-${d}`], label: copticDate, copticDate };
    }
  }

  // أقرب إدخال في الشهر السابق
  const prevMonth = month === 1 ? 13 : month - 1;
  const keysInPrev = Object.keys(dailyReadings)
    .filter(k => k.startsWith(`${prevMonth}-`))
    .map(k => parseInt(k.split('-')[1]))
    .sort((a, b) => b - a);

  if (keysInPrev.length > 0) {
    const d = keysInPrev[0];
    return { reading: dailyReadings[`${prevMonth}-${d}`], label: copticDate, copticDate };
  }

  return { reading: defaultReading, label: copticDate, copticDate };
}

export { feasts };
