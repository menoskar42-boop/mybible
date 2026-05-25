// ── نظام الخرائط الموحّدة للقداسات الثلاثة ──────────────────────────────────
// يربط القسم الواحد (sectionKey) بشرائح من كل قداس بنفس الاسم المنطقي

import { kholagyLiturgies } from './kholagy-data';
import type { OccasionTag } from './liturgy-occasion';
import { occasionInserts } from './liturgy-occasion-content';

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
  // وسوم المناسبة — غيابها يعني مردّ عام يظهر في كل المناسبات
  occasions?: OccasionTag[];
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
export const COPTIC_TEXT_MAP: Record<string, string> = {
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

// ── نصوص قبطية مكتوبة بحروف عربية (ترانسليتريشن)
export const COPTIC_ARABIC_MAP: Record<string, string> = {
  'basil-opening': `بيووو إن إفنوتي خِن نيإتهووت أووَ هيرينى هيجِن بيكاهي أووَ أوثيليل خِن نيرومي.
أنوهوس إيروك أنِسمو إيروك أنووشت إيروك أنتيوو إيروك أنشب إهموت إيروك إثبي بيكنيشتي إن-وو.
بانتوكراتور بينيوت.

بيشيري إن-وات أرخييجينيس بينجوييس إيسوس بيخريستوس نيم بيبنيفما إثوآب.`,
  'basil-synaxar': `أمو خِن أوهيرينى إمبيخريستوس إنسوتيم إبيسيناكساريون.`,
  'basil-reconciliation': `أسبازيسثي أليلوس — إيس أناتولاس فليفاتى
إيراسبازى روو خِن بيهيرينى إثوآب.`,
  'basil-creed': `ماريننجو إمبينيشتي إنهومولوجيا إنتينيستي إناتو.`,
  'basil-anaphora': `بيجوييس نيم تيرو.
نيم بيكبنيفما حوك.`,
  'basil-commemoration': `أريميفي إنتين خوي نيم تيمو ثيوتوكوس ماريا تيبارثينوس إثوآب. آمين.`,
  'basil-communion': `بيواب إنينواب.

أواي بي فيوت إثوآب — أواي بي بيشيري إثوآب — أواي بي بيبنيفما إثوآب. آمين.

أولوجيمينوس بيجوييس إيسوس بيخريستوس بيشيري إمإفنوتي خِن تفي نيم بيكاهي.
أوصانا خِن نيإتهووت. آمين.`,
  'basil-thanksgiving': `شب إهموت ناك بينجوييس بينوتي إثبي تينكينونيا إبول خِن بيكسوما نيم بيكسنوف إثوآب إتيمي.`,
  'greg-anaphora': `إنثوك بيتي إمون لاوو جينجي إنسوك أودى إمون لاوو تي ناك.`,
  'cyril-anaphora': `آمين ثيميليوس نيم ثيبريبيس نيم ثيميثناجي إبي أوبيني.`,
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

// ── مردات الشماس المندرجة في مسار القداس (الصعيد) ──────────────────────────
// تُحقن تلقائياً في مطلع القسم المحدد ← تظهر بالضغط على "التالي" طبيعياً
const SECTION_DEACON_PRELUDE: Partial<Record<string, LiturgySlide[]>> = {

  // ── أوشية الاجتماعات — الهيتنية الأولى ──────────────────────────────
  'basil-litany1': [
    {
      id: 'saidi-congreg',
      role: 'deacon',
      title: 'أوشية الاجتماعات',
      text: 'صلوا من أجل هذه الكنيسة المقدسة واجتماعاتنا.\nأنقذنا وارحمنا وقُمْ عنا يا الله بنعمتك.',
      copticText: 'طبه إيجين باي ارفي إفثواب\nباي نيم نيين جنثووتيم.\nناهمين نيم نانين نيم ثالثوت\nإفنوتي خِن تيكمي.',
    },
  ],

  // ── أوشية البابا — الهيتنية الثانية ──────────────────────────────────
  'basil-litany2': [
    {
      id: 'saidi-pope',
      role: 'deacon',
      title: 'أوشية البابا',
      text: 'صلوا من أجل رئيس كهنتنا البابا انبا تواضروس الثاني الإسكندرية وبطريرك الكرازة المرقسية وشريكة في الخدمة الرسولية أبينا الطوباوي المكرم مطراننا انبا..',
      copticText: 'طبه إيجين بي انجوج\nانتي ني اويب بابا\nانبا تواضروس أبافا\nإثميت هي بابا أفا تواضروس أبو\nأفا شفير\nأنتي ميت شمشي أني\nأبوسطولوس بي\nميتروبوليتيس انيوت\nايطابيوت أفا ميخائيل..',
    },
  ],

  // ── حلول الروح القدس — مطلع الأنافورا ──────────────────────────────
  'basil-anaphora': [
    {
      id: 'saidi-epiclesis',
      role: 'deacon',
      title: 'حلول الروح القدس',
      text: 'اسجدوا لله بخوف ورعدة\nننصت آمين',
      copticText: 'أو أوشت ما إفنوتي\nخين أو هوتي نيم أوسروفي\nماريين اهثين آمين',
    },
  ],
  'greg-anaphora': [
    {
      id: 'saidi-epiclesis-greg',
      role: 'deacon',
      title: 'حلول الروح القدس',
      text: 'اسجدوا لله بخوف ورعدة\nننصت آمين',
      copticText: 'أو أوشت ما إفنوتي\nخين أو هوتي نيم أوسروفي\nماريين اهثين آمين',
    },
  ],
  'cyril-anaphora': [
    {
      id: 'saidi-epiclesis-cyril',
      role: 'deacon',
      title: 'حلول الروح القدس',
      text: 'اسجدوا لله بخوف ورعدة\nننصت آمين',
      copticText: 'أو أوشت ما إفنوتي\nخين أو هوتي نيم أوسروفي\nماريين اهثين آمين',
    },
  ],

  // ── أوشية الموضع + أوشية القرابين — الأواشي القصيرة ────────────────
  'basil-short-litanies': [
    {
      id: 'saidi-place',
      role: 'deacon',
      title: 'أوشية الموضع',
      text: 'صلوا من أجل خلاص العالم ومدينتنا هذه وسائر المدن والقرى والأديرة وبيوت المؤمنين..',
      copticText: 'طبه إيجين أب أوجاي\nإمبي سو. نيم تي فاكي ثاي\nنيم فاكي نيفين تيمي ني أفيت\nنيم في أبو أنتي\nني أثاهاتني..',
    },
    {
      id: 'saidi-offerings',
      role: 'deacon',
      title: 'أوشية القرابين',
      text: 'صلوا من أجل هذه القرابين المقدسة وتقدماتنا والذين قدموها..',
      copticText: 'طبه هيجين ناي قربان اثؤواب\nانشوطاي أو أو نيم\nنين اتشليل نيم\nني ايطاف اينو ايخون\nأسبو يثاي..',
    },
  ],
  'greg-short-lit': [
    {
      id: 'saidi-place-greg',
      role: 'deacon',
      title: 'أوشية الموضع',
      text: 'صلوا من أجل خلاص العالم ومدينتنا هذه وسائر المدن والقرى والأديرة وبيوت المؤمنين..',
      copticText: 'طبه إيجين أب أوجاي\nإمبي سو. نيم تي فاكي ثاي\nنيم فاكي نيفين تيمي ني أفيت\nنيم في أبو أنتي\nني أثاهاتني..',
    },
    {
      id: 'saidi-offerings-greg',
      role: 'deacon',
      title: 'أوشية القرابين',
      text: 'صلوا من أجل هذه القرابين المقدسة وتقدماتنا والذين قدموها..',
      copticText: 'طبه هيجين ناي قربان اثؤواب\nانشوطاي أو أو نيم\nنين اتشليل نيم\nني ايطاف اينو ايخون\nأسبو يثاي..',
    },
  ],

  // ── الاعتراف — مرد الشماس قبل التناول ──────────────────────────────
  'basil-confession': [
    {
      id: 'saidi-confession',
      role: 'deacon',
      title: 'الاعتراف — مرد الشماس',
      text: 'أومن أومن أومن، أن هذا هو بالحقيقة أمين.\nأطلبوا عنا وعن كل المسيحيين الذين قالوا لنا أن نذكرهم في بيت الرب.\nومحبة ربنا يسوع المسيح معكم ترتلوا بنشيد الليلويا.\nصلوا من أجل التناول باستحقاق من هذه الأسرار الطاهرة السمانية.\nيا رب ارحم..',
      copticText: 'أمين أمين أمين\nتي ناهتي تي ناهتي جي ثاي\nتي خين أوميثمي أمين\nطبه أيجين نيم إيخرستيانوس نيفين\nإيطاف جوس نان اثفيتو جي ابني ايشويس\nأو أمبيشا..',
    },
  ],
  'greg-confession': [
    {
      id: 'saidi-confession-greg',
      role: 'deacon',
      title: 'الاعتراف — مرد الشماس',
      text: 'أومن أومن أومن، أن هذا هو بالحقيقة أمين.\nأطلبوا عنا وعن كل المسيحيين الذين قالوا لنا أن نذكرهم في بيت الرب.\nومحبة ربنا يسوع المسيح معكم ترتلوا بنشيد الليلويا.\nصلوا من أجل التناول باستحقاق من هذه الأسرار الطاهرة السمانية.\nيا رب ارحم..',
      copticText: 'أمين أمين أمين\nتي ناهتي تي ناهتي جي ثاي\nتي خين أوميثمي أمين\nطبه أيجين نيم إيخرستيانوس نيفين\nإيطاف جوس نان اثفيتو جي ابني ايشويس\nأو أمبيشا..',
    },
  ],
  'cyril-confession': [
    {
      id: 'saidi-confession-cyril',
      role: 'deacon',
      title: 'الاعتراف — مرد الشماس',
      text: 'أومن أومن أومن، أن هذا هو بالحقيقة أمين.\nأطلبوا عنا وعن كل المسيحيين الذين قالوا لنا أن نذكرهم في بيت الرب.\nومحبة ربنا يسوع المسيح معكم ترتلوا بنشيد الليلويا.\nصلوا من أجل التناول باستحقاق من هذه الأسرار الطاهرة السمانية.\nيا رب ارحم..',
      copticText: 'أمين أمين أمين\nتي ناهتي تي ناهتي جي ثاي\nتي خين أوميثمي أمين\nطبه أيجين نيم إيخرستيانوس نيفين\nإيطاف جوس نان اثفيتو جي ابني ايشويس\nأو أمبيشا..',
    },
  ],
};

// ── إقحام محتوى المناسبة في موضعه الطقسي ضمن مسار القداس ────────────────────
export interface OccasionInsert {
  occasion: OccasionTag;
  anchorSectionKey: string;
  position: 'before' | 'after' | 'prelude';
  slides: LiturgySlide[];
}

function getOccasionInserts(
  sectionKey: string,
  occasion: OccasionTag,
  position: OccasionInsert['position'],
): LiturgySlide[] {
  return occasionInserts
    .filter(ins => ins.occasion === occasion && ins.anchorSectionKey === sectionKey && ins.position === position)
    .flatMap(ins => ins.slides);
}

// ── واجهة القراءات اليومية الديناميكية
export interface DailyReadingSlides {
  pauline:  { title: string; slides: string[] };
  catholic: { title: string; slides: string[] };
  praxis:   { title: string; slides: string[] };
  psalm:    { title: string; slides: string[] };
  synaxar:  { title: string; slides: string[] };
  gospel:   { title: string; slides: string[] };
}

// ── أقسام القراءات (تُستبدَل ديناميكياً في شاشة العرض)
export const READINGS_SECTION_KEYS = new Set([
  'basil-pauline',  'greg-pauline',  'cyril-pauline',
  'basil-catholic', 'greg-catholic', 'cyril-catholic',
  'basil-praxis',   'greg-praxis',   'cyril-praxis',
  'basil-synaxar',  'greg-synaxar',  'cyril-synaxar',
  'basil-gospel',   'greg-gospel',   'cyril-gospel',
]);

export function getReadingType(sectionKey: string): keyof DailyReadingSlides | null {
  if (sectionKey.includes('pauline'))  return 'pauline';
  if (sectionKey.includes('catholic')) return 'catholic';
  if (sectionKey.includes('praxis'))   return 'praxis';
  if (sectionKey.includes('synaxar'))  return 'synaxar';
  if (sectionKey.includes('gospel'))   return 'gospel';
  return null;
}

// ── واجهة حالة الجلسة
export interface LiturgySession {
  sessionId: string;
  liturgyType: LiturgyType;
  sectionKey: string;
  slideIndex: number;
  deaconOverride: DeaconResponse | null;
  copticMode: 'script' | 'arabic';
  readingsOverride: DailyReadingSlides | null;
  occasion: OccasionTag;
  updatedAt: number;
}

export const defaultSession: LiturgySession = {
  sessionId: 'main',
  liturgyType: 'basil',
  sectionKey: 'basil-opening',
  slideIndex: 0,
  deaconOverride: null,
  copticMode: 'script',
  readingsOverride: null,
  occasion: 'ordinary',
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
    ...(section.copticText ? { copticText: section.copticText } : COPTIC_TEXT_MAP[section.id] ? { copticText: COPTIC_TEXT_MAP[section.id] } : {}),
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

// الحد الأقصى للأحرف في الشريحة — 150 لنص منفرد، 120 لكل جانب في النص الثنائي
const SLIDE_MAX_CHARS = 150;
const SLIDE_MAX_CHARS_BILINGUAL = 120;

// تقسيم متوازٍ: العربي والقبطي معاً فقرةً بفقرة — يضمن عدم فقدان النص القبطي
function splitParallelTexts(
  arabicText: string,
  copticText: string,
  maxPerSide: number,
): { arabic: string; coptic: string }[] {
  const arabicParas = arabicText.split('\n').filter(p => p.trim() !== '');
  const copticParas = copticText.split('\n').filter(p => p.trim() !== '');
  const pages: { arabic: string; coptic: string }[] = [];
  let curA = '';
  let curC = '';
  const len = Math.max(arabicParas.length, copticParas.length);
  for (let i = 0; i < len; i++) {
    const ap = arabicParas[i] ?? '';
    const cp = copticParas[i] ?? '';
    const candA = curA ? curA + '\n' + ap : ap;
    const candC = curC ? curC + '\n' + cp : cp;
    if (candA.length <= maxPerSide && candC.length <= maxPerSide) {
      curA = candA;
      curC = candC;
    } else {
      if (curA || curC) pages.push({ arabic: curA, coptic: curC });
      curA = ap;
      curC = cp;
    }
  }
  if (curA || curC) pages.push({ arabic: curA, coptic: curC });
  return pages.length > 0 ? pages : [{ arabic: arabicText, coptic: copticText }];
}

// ── نسخة مقسّمة من getSlidesForSection
// كل شريحة طويلة تُقسَّم إلى شرائح منفصلة بنفس الدور والعنوان
export function getSplitSlidesForSection(
  liturgyType: LiturgyType,
  sectionKey: string,
  occasion: OccasionTag = 'ordinary',
  maxChars = SLIDE_MAX_CHARS,
): LiturgySlide[] {
  const slides = getSlidesForSection(liturgyType, sectionKey);
  const result: LiturgySlide[] = [];

  for (const slide of slides) {
    // شريحة ثنائية اللغة — تقسيم متوازٍ يحافظ على المحاذاة
    if (slide.copticText) {
      const fits =
        slide.text.length <= SLIDE_MAX_CHARS_BILINGUAL &&
        slide.copticText.length <= SLIDE_MAX_CHARS_BILINGUAL;
      if (fits) {
        result.push(slide);
        continue;
      }
      const pairs = splitParallelTexts(slide.text, slide.copticText, SLIDE_MAX_CHARS_BILINGUAL);
      pairs.forEach((pair, i) => {
        result.push({
          ...slide,
          id: `${slide.id}-p${i + 1}`,
          text: pair.arabic,
          copticText: pair.coptic,
          title: pairs.length > 1 ? `${slide.title} (${i + 1}/${pairs.length})` : slide.title,
        });
      });
      continue;
    }
    // شريحة عربية فقط — التقسيم القديم
    if (slide.text.length <= maxChars) {
      result.push(slide);
      continue;
    }
    const pages = splitTextIntoPages(slide.text, maxChars);
    pages.forEach((page, i) => {
      result.push({
        ...slide,
        id: `${slide.id}-p${i + 1}`,
        text: page,
        title: pages.length > 1 ? `${slide.title} (${i + 1}/${pages.length})` : slide.title,
      });
    });
  }

  // أقحم مردات الشماس في مقدمة الشرائح ← تظهر تلقائياً بالضغط على "التالي"
  const prelude = SECTION_DEACON_PRELUDE[sectionKey] ?? [];
  // إقحامات المناسبة في موضعها الطقسي الصحيح (قبل/مطلع/بعد)
  const occBefore  = getOccasionInserts(sectionKey, occasion, 'before');
  const occPrelude = getOccasionInserts(sectionKey, occasion, 'prelude');
  const occAfter   = getOccasionInserts(sectionKey, occasion, 'after');
  return [...occBefore, ...occPrelude, ...prelude, ...result, ...occAfter];
}

// ── مجموعات الأقسام المتكافئة بين القداسات الثلاثة
// كل سجل يربط الأقسام ذات الدلالة الليتورجية المتماثلة
const SECTION_GROUPS: Partial<Record<LiturgyType, string>>[] = [
  { basil: 'basil-veil',           gregory: 'greg-veil',          cyril: 'cyril-veil' },
  { basil: 'basil-reconciliation', gregory: 'greg-reconcil',      cyril: 'cyril-reconcil' },
  { basil: 'basil-reconcil2',      gregory: 'greg-reconcil2',     cyril: 'cyril-reconcil2' },
  { basil: 'basil-anaphora',       gregory: 'greg-anaphora',      cyril: 'cyril-anaphora' },
  { basil: 'basil-institution',    gregory: 'greg-institution',   cyril: 'cyril-institution' },
  { basil: 'basil-short-litanies', gregory: 'greg-short-lit',     cyril: 'cyril-litany-3' },
  { basil: 'basil-commemoration',  gregory: 'greg-commemoration', cyril: 'cyril-commemoration' },
  { basil: 'basil-fraction',       gregory: 'greg-fraction',      cyril: 'cyril-fraction' },
  { basil: 'basil-submission',     gregory: 'greg-our-father',    cyril: 'cyril-our-father' },
  { basil: 'basil-absolution2',    gregory: 'greg-absolution',    cyril: 'cyril-absolution' },
  { basil: 'basil-confession',     gregory: 'greg-confession',    cyril: 'cyril-confession' },
  { basil: 'basil-communion',      gregory: 'greg-communion',     cyril: 'cyril-communion' },
  { basil: 'basil-post-communion', gregory: 'greg-thanksgiving',  cyril: 'cyril-thanksgiving' },
  { basil: 'basil-laying-hands',   gregory: 'greg-laying-hands',  cyril: 'cyril-thanksgiving' },
];

// ينقل الموضع من قداس إلى قداس آخر: يبحث أولاً في الأقسام المتكافئة، ثم يقدّر نسبياً
export function findEquivalentSection(
  fromType: LiturgyType,
  sectionKey: string,
  toType: LiturgyType,
): string {
  const group = SECTION_GROUPS.find(g => g[fromType] === sectionKey);
  if (group?.[toType]) return group[toType]!;

  const fromSections = getSectionsForLiturgy(fromType);
  const toSections = getSectionsForLiturgy(toType);
  if (toSections.length === 0) return '';

  const fromIdx = fromSections.findIndex(s => s.sectionKey === sectionKey);
  if (fromIdx === -1) return toSections[0].sectionKey;

  const ratio = fromIdx / Math.max(fromSections.length - 1, 1);
  const toIdx = Math.round(ratio * (toSections.length - 1));
  return toSections[toIdx].sectionKey;
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
