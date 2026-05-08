export interface AgpeyaHour {
  id: string;
  name: string;
  arabicTime: string;
  description: string;
  psalms: string;
  url: string;
}

export interface LiturgyBook {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  pdfUrl?: string;
}

export interface HymnCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
}

export interface SaintVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  category: string;
}

// ── الأجبية — روابط الكتاب الكامل ───────────────────────────────────────────
export interface AgpeyaBook {
  id: string;
  title: string;
  description: string;
  lang: string;
  url: string;
  type: 'pdf' | 'site';
}

export const agpeyaBooks: AgpeyaBook[] = [
  {
    id: 'agpeya-three-lang',
    title: 'الأجبية — عربي / قبطي / إنجليزي',
    description: 'كتاب الأجبية الكامل بثلاث لغات — للإيبوذياكون باسم سليمان — مشروع الكنوز القبطية.',
    lang: 'عربي + قبطي + إنجليزي',
    url: 'https://coptic-treasures.com/book/%D8%A7%D9%84%D8%A3%D8%AC%D8%A8%D9%8A%D8%A9-%D8%B9%D8%B1%D8%A8%D9%8A-%D8%A7%D9%86%D8%AC%D9%84%D9%8A%D8%B2%D9%8A-%D9%82%D8%A8%D8%B7%D9%8A-%D8%A5%D9%8A%D8%A8%D9%88%D8%B0%D9%8A%D8%A7%D9%83%D9%88/',
    type: 'pdf',
  },
  {
    id: 'agpeya-ar-coptic',
    title: 'الأجبية — عربي / قبطي',
    description: 'نسخة الأجبية باللغتين العربية والقبطية من المكتبة القبطية الأرثوذكسية.',
    lang: 'عربي + قبطي',
    url: 'https://copticbook.wordpress.com/liturgical-books/',
    type: 'pdf',
  },
  {
    id: 'agpeya-site',
    title: 'الأجبية — موقع agpeya.org',
    description: 'اقرأ الأجبية كاملةً أونلاين بالقبطية والعربية والإنجليزية — مع ساعات الصلاة السبع.',
    lang: 'عربي + قبطي + إنجليزي',
    url: 'https://agpeya.org',
    type: 'site',
  },
  {
    id: 'agpeya-takla',
    title: 'الأجبية — موقع الأنبا تكلا',
    description: 'الأجبية كاملةً بالعربية على موقع الأنبا تكلاهيمانوت مع شرح كل ساعة.',
    lang: 'عربي',
    url: 'https://st-takla.org/Liturgy-Taksa-و-Ekhologion/Agpia-Agpeya-arabic-coptic-liturgical-book/Agpia-000-index.html',
    type: 'site',
  },
];

// ── الأجبية — ساعات الصلاة السبع ────────────────────────────────────────────
export const agpeyaHours: AgpeyaHour[] = [
  {
    id: 'prime',
    name: 'صلاة باكر',
    arabicTime: 'الساعة 6 صباحاً',
    description: 'أولى ساعات الصلاة، تُذكّر بقيامة المسيح ونور اليوم الجديد. نبدأ بها يومنا مع الرب.',
    psalms: 'مزمور 63، 51، 150',
    url: 'https://agpeya.org/prime',
  },
  {
    id: 'terce',
    name: 'صلاة الساعة الثالثة',
    arabicTime: 'الساعة 9 صباحاً',
    description: 'تُحيي ذكرى نزول الروح القدس على الرسل في العليّة يوم الخمسين.',
    psalms: 'مزمور 19، 22، 150',
    url: 'https://agpeya.org/terce',
  },
  {
    id: 'sext',
    name: 'صلاة الساعة السادسة',
    arabicTime: 'الساعة 12 ظهراً',
    description: 'تُذكّر بصلب السيد المسيح في الساعة السادسة، وظلمة نصف النهار.',
    psalms: 'مزمور 55، 56، 57',
    url: 'https://agpeya.org/sext',
  },
  {
    id: 'none',
    name: 'صلاة الساعة التاسعة',
    arabicTime: 'الساعة 3 مساءً',
    description: 'تُحيي ذكرى وفاة السيد المسيح على الصليب وتسليمه الروح للآب.',
    psalms: 'مزمور 66، 116، 117',
    url: 'https://agpeya.org/none',
  },
  {
    id: 'vespers',
    name: 'صلاة الغروب',
    arabicTime: 'عند الغروب',
    description: 'تُذكّر بنزول السيد المسيح من الصليب ودفنه، وتشكر الله على نعم اليوم.',
    psalms: 'مزمور 104، 116، 128',
    url: 'https://agpeya.org/vespers',
  },
  {
    id: 'compline',
    name: 'صلاة النوم',
    arabicTime: 'قبل النوم',
    description: 'نختم بها يومنا ونُودع أنفسنا في حضن الله قبل النوم.',
    psalms: 'مزمور 4، 6، 12',
    url: 'https://agpeya.org/compline',
  },
  {
    id: 'midnight',
    name: 'صلاة نصف الليل',
    arabicTime: 'منتصف الليل',
    description: 'تُذكّر بمجيء العريس في نصف الليل، وتنتظر قيامة المسيح الأولى.',
    psalms: 'مزمور 119، 133، 134',
    url: 'https://agpeya.org/midnight',
  },
];

// ── الخولاجي والقداسات ────────────────────────────────────────────────────────
export const liturgyBooks: LiturgyBook[] = [
  {
    id: 'basil',
    name: 'قداس القديس باسيليوس',
    description: 'أكثر القداسات شيوعاً في الكنيسة القبطية الأرثوذكسية، يُقام في معظم أيام الأسبوع والأحد والأعياد. وضعه القديس باسيليوس الكبير.',
    icon: '✝️',
    url: 'https://st-takla.org/Lyrics-Spiritual-Songs/Words-of-Coptic-Alhan-Tasbeha-Kodas/Arabic-Coptic-Liturgy-Lyrics/Arab-Copts-Mass-Book-002-index-El-Kodas-El-Basily.html',
    pdfUrl: 'https://copticbook.wordpress.com/liturgical-books/',
  },
  {
    id: 'gregory',
    name: 'قداس القديس غريغوريوس',
    description: 'يُقام في الأعياد السيدية الكبرى السبعة: الميلاد، الغطاس، الشعانين، التجلّي، القيامة، الصعود، والعنصرة. وضعه القديس غريغوريوس الناطق بالإلهيات.',
    icon: '🕊️',
    url: 'https://st-takla.org/Lyrics-Spiritual-Songs/Words-of-Coptic-Alhan-Tasbeha-Kodas/Arabic-Coptic-Liturgy-Lyrics/Arab-Copts-Mass-Book-003-index-Al-Koddas-Al-Ghreghory.html',
    pdfUrl: 'https://copticbook.wordpress.com/liturgical-books/',
  },
  {
    id: 'cyril',
    name: 'قداس القديس كيرلس (المرقسي)',
    description: 'أقدم القداسات القبطية، يُقام في أيام الصوم الكبير المقدس. وضعه مار مرقس الرسول وأضاف إليه القديس كيرلس تعديلات. يتميز بمسحة نسكية خشوعية.',
    icon: '📖',
    url: 'https://st-takla.org/Lyrics-Spiritual-Songs/Words-of-Coptic-Alhan-Tasbeha-Kodas/Arabic-Coptic-Liturgy-Lyrics/Arab-Copts-Mass-Book-000-index.html',
    pdfUrl: 'https://copticbook.wordpress.com/liturgical-books/',
  },
  {
    id: 'kholagy-full',
    name: 'الخولاجي الكامل — موقع الأنبا تكلا',
    description: 'نصوص الثلاثة القداسات كاملةً مع خدمة الشماس والألحان باللغتين العربية والقبطية.',
    icon: '🏛️',
    url: 'https://st-takla.org/Lyrics-Spiritual-Songs/Words-of-Coptic-Alhan-Tasbeha-Kodas/Arabic-Coptic-Liturgy-Lyrics/Arab-Copts-Mass-Book-000-index.html',
    pdfUrl: 'https://archive.org/details/The4HolyLiturgiesOfTheOrthodoxChurchCoptic',
  },
];

// ── كتب الألحان القبطية ──────────────────────────────────────────────────────
export interface HymnBook {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  source: string;
}

export const hymnBooks: HymnBook[] = [
  {
    id: 'ibsalmodia-annual',
    name: 'الإبصلمودية السنوية',
    description: 'كتاب التسبحة اليومية الكاملة التي تُتلى عشية ونصف الليل وباكر كل يوم — بالعربي والقبطي.',
    icon: '📖',
    url: 'https://copticbook.wordpress.com/liturgical-books/',
    source: 'المكتبة القبطية الأرثوذكسية',
  },
  {
    id: 'ibsalmodia-kiahk',
    name: 'الإبصلمودية الكيهكية',
    description: 'ألحان تسبحة شهر كيهك المقدس وقطعه ومدائحه وذكصولوجياته — خاصة باستقبال ميلاد الرب.',
    icon: '⭐',
    url: 'https://st-takla.org/Lyrics-Spiritual-Songs/Words-of-Coptic-Alhan-Tasbeha-Kodas/Arabic-Coptic-04-Epsalmodia-Tasbeha/Arab-Copts-Tasbeha-Ebsalmodya-Book-000-index.html',
    source: 'موقع الأنبا تكلا',
  },
  {
    id: 'tasbeha-full',
    name: 'تسبحة نصف الليل — الهوسات والإبصاليات',
    description: 'كلمات تسبحة نصف الليل كاملةً: الهوسات والإبصاليات والذكصولوجيات مرتبة بالتفصيل لكل أيام الأسبوع.',
    icon: '🌙',
    url: 'https://st-takla.org/Lyrics-Spiritual-Songs/Words-of-Coptic-Alhan-Tasbeha-Kodas/Arabic-Coptic-04-Epsalmodia-Tasbeha/Arab-Copts-Tasbeha-Ebsalmodya-Book-000-index.html',
    source: 'موقع الأنبا تكلا',
  },
  {
    id: 'copticwave-hymns',
    name: 'معهد الألحان القبطية',
    description: 'موقع الموجة القبطية — معهد الألحان القبطية الكاملة مع النطق والشرح الطقسي.',
    icon: '🎼',
    url: 'https://copticwave.org/alhan/index.htm',
    source: 'copticwave.org',
  },
  {
    id: 'tasbeha-org-lib',
    name: 'مكتبة tasbeha.org',
    description: 'المكتبة الصوتية والنصية لألحان القداس والتسبحة وجميع المناسبات الطقسية القبطية.',
    icon: '🎵',
    url: 'https://tasbeha.org',
    source: 'tasbeha.org',
  },
  {
    id: 'coptic-treasures-hymns',
    name: 'الكنوز القبطية — كتب الألحان',
    description: 'مشروع الكنوز القبطية — مكتبة إلكترونية شاملة لكتب الألحان والعظات والكتب الطقسية.',
    icon: '💎',
    url: 'https://coptic-treasures.com',
    source: 'coptic-treasures.com',
  },
];

// ── ألحان قبطية — تصنيفات ────────────────────────────────────────────────────
export const hymnCategories: HymnCategory[] = [
  {
    id: 'tasbeha',
    name: 'التسبحة المقدسة',
    description: 'ألحان تسبحة منتصف الليل وصلاة باكر الليلية.',
    icon: '🎵',
    url: 'https://tasbeha.org',
  },
  {
    id: 'kiahk',
    name: 'ألحان شهر كيهك',
    description: 'ألحان شهر كيهك المقدس والتسابيح الخاصة بميلاد السيد المسيح.',
    icon: '⭐',
    url: 'https://tasbeha.org',
  },
  {
    id: 'passion',
    name: 'ألحان أسبوع الآلام',
    description: 'ألحان أسبوع البصخة المقدسة وخدمات الجمعة العظيمة.',
    icon: '✝️',
    url: 'https://tasbeha.org',
  },
  {
    id: 'resurrection',
    name: 'ألحان القيامة',
    description: 'ألحان عيد القيامة المجيدة وخماسيات الفرح.',
    icon: '🌅',
    url: 'https://tasbeha.org',
  },
  {
    id: 'liturgy-hymns',
    name: 'ألحان القداس',
    description: 'ألحان وتروس القداس الإلهي وخدمات الكنيسة اليومية.',
    icon: '🕊️',
    url: 'https://tasbeha.org',
  },
  {
    id: 'coptichymns',
    name: 'ألحان قبطية متنوعة',
    description: 'مجموعة واسعة من الألحان القبطية المقدسة لجميع المناسبات.',
    icon: '🎶',
    url: 'http://www.coptichymnsinenglish.com',
  },
];

// ── فيديوهات سير القديسين والشهداء ───────────────────────────────────────────
export const saintsVideos: SaintVideo[] = [
  {
    id: 'mark-apostle',
    youtubeId: 'PXXY9kSHiNY',
    title: 'سيرة القديس مارمرقس الرسول — كاروز الديار المصرية',
    description: 'قصة حياة القديس مارمرقس الرسول، أول بابا للإسكندرية ومؤسس الكنيسة القبطية، بأسلوب كرتوني ممتع بالعربية.',
    category: 'رسل',
  },
  {
    id: 'mina-wonder',
    youtubeId: 'eojiLDROk4o',
    title: 'سيرة القديس مارمينا العجائبي',
    description: 'قصة حياة القديس مينا الجندي المصري الذي ترك الجيش الروماني وآثر الاستشهاد على إنكار إيمانه بالمسيح.',
    category: 'شهداء',
  },
  {
    id: 'bishoy-great',
    youtubeId: 'doIPHQfX4w4',
    title: 'سيرة القديس الأنبا بيشوي — الرجل الكامل حبيب المخلص',
    description: 'قصة حياة القديس الأنبا بيشوي، أعظم نساك وادي النطرون والراهب الذي أُكرم بحضن المسيح الشخصي له.',
    category: 'رهبان',
  },
  {
    id: 'makarios-great',
    youtubeId: 'kD7thEK_ors',
    title: 'سيرة القديس الأنبا مقار الكبير',
    description: 'قصة حياة القديس الأنبا مقار الكبير، أبو البراري وأحد أعمدة الرهبنة القبطية في وادي النطرون.',
    category: 'رهبان',
  },
  {
    id: 'dimiana-martyr',
    youtubeId: 'BNQmw86rgPI',
    title: 'سيرة القديسة دميانة الشهيدة',
    description: 'قصة حياة القديسة دميانة بنت المرزبان مركوريوس، التي رفضت الزواج وكرّست حياتها لله حتى نالت إكليل الاستشهاد.',
    category: 'شهيدات',
  },
  {
    id: 'anthony-monks',
    youtubeId: 'RnK_w9VYZI0',
    title: 'سيرة القديس الأنبا أنطونيوس أبو الرهبان',
    description: 'قصة حياة القديس أنطونيوس الكبير مؤسس الرهبنة المسيحية، الذي تنازل عن كل ثروته وعاش في البرية مجاهداً.',
    category: 'رهبان',
  },
  {
    id: 'karas-monk',
    youtubeId: 'feXcTHa_BUw',
    title: 'سيرة القديس الأنبا كاراس السائح',
    description: 'قصة حياة القديس أنبا كاراس الراهب السائح، الذي عاش 57 سنة في البرية المصرية دون أن يرى وجه إنسان.',
    category: 'رهبان',
  },
  {
    id: 'abanoub-child',
    youtubeId: 'Bds1DgsPXq0',
    title: 'سيرة الشهيد أبانوب الطفل القبطي',
    description: 'قصة الطفل الشهيد أبانوب النهيسي (12 سنة) الذي استشهد في عهد دقلديانوس رافضاً إنكار المسيح — بأسلوب كرتوني.',
    category: 'شهداء',
  },
  {
    id: 'cyril-vi',
    youtubeId: '48GlOckNjRg',
    title: 'سيرة البابا كيرلس السادس — البطريرك الـ116',
    description: 'قصة حياة قداسة البابا كيرلس السادس، بابا الإسكندرية، الراهب الناسك الذي عاش في طاحونة هواء قبل توليه الكرسي البابوي.',
    category: 'آباء',
  },
  {
    id: 'habib-salib',
    youtubeId: '5n0wKsWy9g4',
    title: 'حبيب الصليب — سيرة الشهيد القبطي الحديث',
    description: 'قصة حياة ومعجزات الشهيد حبيب الصليب، الشهيد القبطي الذي لقب بـ"حبيب الصليب" نظراً لمحبته الشديدة للمسيح.',
    category: 'شهداء',
  },
  {
    id: 'martyrs21-story',
    youtubeId: 'm9eSaKOUqRk',
    title: 'قصة شهداء ليبيا الـ21 — شهداء الكنيسة والوطن',
    description: 'قصة شهداء ليبيا الـ21 كما يرويها شاهد عيان قبطي — الشباب المصري الذي فضّل الموت على إنكار المسيح عام 2015.',
    category: 'شهداء',
  },
  {
    id: 'martyrs21-film',
    youtubeId: 'Z3F-yaet8fA',
    title: 'قصة شهداء ليبيا الـ21 كما لم تُروَ من قبل',
    description: 'رواية سينمائية مؤثرة بالذكاء الاصطناعي لقصة الشهداء الأقباط الـ21 في ليبيا — رحلة إيمان هزّت العالم.',
    category: 'شهداء',
  },
  // ── أفلام درامية تمثيلية — إنتاج الكنيسة القبطية الأرثوذكسية ─────────────
  {
    id: 'samaan-tanner-hd',
    youtubeId: 'G3rymeKazFo',
    title: 'فيلم القديس سمعان الخراز — إنتاج دير سمعان HD',
    description: 'فيلم درامي تمثيلي ضخم بجودة عالية عن سيرة القديس سمعان الخراز الذي أجرى معجزة تحريك جبل المقطم بإيمانه — إنتاج دير القديس سمعان الخراز بالقاهرة.',
    category: 'أفلام درامية',
  },
  {
    id: 'jowa-eltahona',
    youtubeId: 'ovjC06uo-gQ',
    title: 'فيلم جوة الطاحونة — سيرة البابا كيرلس السادس',
    description: 'فيلم درامي تمثيلي كامل عن حياة قداسة البابا كيرلس السادس منذ شبابه الناسك في طاحونة الهواء حتى توليه كرسي البابوية — إنتاج كنسي قبطي.',
    category: 'أفلام درامية',
  },
  {
    id: 'saken-elkobar',
    youtubeId: 'R38a7y4ARSM',
    title: 'فيلم ساكن القبور — القديس يعقوب المجاهد',
    description: 'فيلم درامي تمثيلي مؤثر عن سيرة القديس يعقوب المجاهد الناسك الذي اختار السكن بين القبور رياضةً روحية — إنتاج قبطي أرثوذكسي.',
    category: 'أفلام درامية',
  },
  {
    id: 'abo-tarha-film',
    youtubeId: 's_7qI5ROT-M',
    title: 'فيلم الأنبا صرابامون أبو طرحة',
    description: 'الفيلم الكلاسيكي الشهير عن سيرة القديس الأنبا صرابامون أبو طرحة — من أبرز الأفلام الدرامية التمثيلية في تاريخ السينما الدينية القبطية.',
    category: 'أفلام درامية',
  },
  {
    id: 'petros-elaabed',
    youtubeId: 'Ar0G0GT5tFM',
    title: 'فيلم القديس بطرس العابد',
    description: 'عمل درامي تمثيلي تاريخي متميز عن سيرة القديس بطرس العابد — فيلم قبطي كنسي يجسّد حياة القديس بأسلوب سينمائي راقٍ.',
    category: 'أفلام درامية',
  },
  {
    id: 'filotathos-film',
    youtubeId: '7Gi8ZzKAEV0',
    title: 'فيلم القديس الشهيد فيلوتاؤوس — إنتاج ميديا سات',
    description: 'فيلم درامي تمثيلي عن سيرة القديس الشهيد فيلوتاؤوس — من إنتاج شركة ميديا سات المتخصصة في الأفلام القبطية الدرامية.',
    category: 'أفلام درامية',
  },
  {
    id: 'onisimos-film',
    youtubeId: 'n39zpM_ekeg',
    title: 'فيلم القديس الشهيد أنسيموس — إنتاج ميديا سات',
    description: 'فيلم درامي تمثيلي عن سيرة القديس الشهيد أنسيموس — إنتاج شركة ميديا سات المتخصصة في الأفلام الكنسية القبطية.',
    category: 'أفلام درامية',
  },
  {
    id: 'hermina-film',
    youtubeId: 'toTZZFhd7sI',
    title: 'فيلم القديس الأنبا هرمينا السائح — إنتاج ميديا سات',
    description: 'فيلم درامي تمثيلي عن سيرة القديس الأنبا هرمينا السائح الناسك — إنتاج ميديا سات بجودة عالية للكنيسة القبطية الأرثوذكسية.',
    category: 'أفلام درامية',
  },
  {
    id: 'mary-egyptian-film',
    youtubeId: 'EsBMwC64aHc',
    title: 'فيلم القديسة البارة مريم المصرية السائحة — قناة هللويا',
    description: 'فيلم درامي تمثيلي كامل عن سيرة القديسة التائبة مريم المصرية والقديس الأنبا زوسيما — إنتاج قبطي أرثوذكسي من قناة Alleluia.',
    category: 'أفلام درامية',
  },
  {
    id: 'athanasius-syriac-film',
    youtubeId: 'ItwBw1Bu6-o',
    title: 'فيلم الراهب الساهر القمص أثناسيوس السرياني — قناة هللويا',
    description: 'فيلم درامي تمثيلي عن سيرة الراهب الناسك القمص أثناسيوس السرياني — من إنتاج قناة Alleluia الكنسية القبطية.',
    category: 'أفلام درامية',
  },
  {
    id: 'samaan-akhmimy-film',
    youtubeId: 'IZJpL9Pt0Ks',
    title: 'فيلم شفيع المتألمين — القديس سمعان الاخميمي',
    description: 'فيلم درامي تمثيلي مؤثر عن سيرة القديس سمعان الاخميمي شفيع المتألمين — عمل كنسي قبطي يصوّر حياة القديس بأسلوب سينمائي.',
    category: 'أفلام درامية',
  },
];

export const videoCategories = ['أفلام درامية', 'شهداء', 'رسل', 'شهيدات', 'آباء', 'رهبان'];

// ── روابط القطمارس ────────────────────────────────────────────────────────────
export interface KatamerosLink {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  lang: string;
  featured?: boolean;
}

export const katamerosLinks: KatamerosLink[] = [
  {
    id: 'katameros-app',
    name: 'katameros.app',
    description: 'القطمارس القبطي الكامل — قراءات اليوم بـ 8 لغات منها العربية مع التقويم القبطي.',
    icon: '📅',
    url: 'https://katameros.app',
    lang: 'عربي + 7 لغات',
    featured: true,
  },
  {
    id: 'takla-readings',
    name: 'موقع الأنبا تكلا — القراءات اليومية',
    description: 'القراءات اليومية حسب التقويم القبطي مع السنكسار والإنجيل والرسائل والمزامير.',
    icon: '📖',
    url: 'https://st-takla.org/zJ/index.php/ar-readings-katamares',
    lang: 'عربي + إنجليزي',
  },
  {
    id: 'ava-bishoy-katameros',
    name: 'كنيسة الأنبا بيشوي — القطمارس',
    description: 'القطمارس السنوي الكامل من موقع كنيسة الأنبا بيشوي.',
    icon: '⛪',
    url: 'https://katamars.avabishoy.com/',
    lang: 'عربي',
  },
  {
    id: 'orsozox-katameros',
    name: 'المكتبة القبطية OrSoZoX',
    description: 'المكتبة القبطية الأرثوذكسية الشاملة — القطمارس والقراءات اليومية.',
    icon: '📚',
    url: 'https://orsozox.com/%D8%A7%D9%84%D9%82%D8%B7%D9%85%D8%A7%D8%B1%D8%B3-%D9%88-%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D8%A1%D8%A7%D8%AA-%D8%A7%D9%84%D9%8A%D9%88%D9%85%D9%8A%D8%A9/',
    lang: 'عربي',
  },
  {
    id: 'ayakolyoum-katameros',
    name: 'آية كل يوم — قراءات القطمارس',
    description: 'قراءات القطمارس اليومية مع صلوات وشروحات روحية وخرائط وأقسام كاملة.',
    icon: '🌅',
    url: 'https://ayakolyoum.com/katamaros',
    lang: 'عربي',
  },
  {
    id: 'katameros-bible',
    name: 'دراسات في القراءات — katameros.bible',
    description: 'دراسات معمّقة في قراءات القطمارس اليومية مع مختارات من عظات آباء الكنيسة.',
    icon: '✝️',
    url: 'https://new.katameros.bible/readings/',
    lang: 'إنجليزي',
  },
];

// ── مواقع سير القديسين والشهداء الأقباط ──────────────────────────────────────
export interface MartyrsResource {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  highlight: string;
}

export const martyrsResources: MartyrsResource[] = [
  {
    id: 'takla-saints',
    name: 'قاموس القديسين — موقع الأنبا تكلا',
    description: 'أشمل مرجع عربي لسير القديسين والشهداء الأقباط — مرتبون أبجدياً مع صور وشرح مفصّل.',
    icon: '📖',
    url: 'https://st-takla.org/Saints/Coptic-Saint-Hagiography-Kediseen-00-index.html',
    highlight: 'آلاف القديسين مرتبين أبجدياً',
  },
  {
    id: 'coptic-treasures-saints',
    name: 'مشروع الكنوز القبطية',
    description: 'مكتبة رقمية ضخمة تحتوي على كتب سير القديسين والشهداء وعظات آباء الكنيسة.',
    icon: '💎',
    url: 'https://coptic-treasures.com',
    highlight: 'كتب وعظات وصوتيات',
  },
  {
    id: 'copticwave-history',
    name: 'موقع الموجة القبطية — التاريخ',
    description: 'تاريخ الكنيسة القبطية وسير قديسيها وشهدائها مع شرح معمّق للطقوس والتقاليد.',
    icon: '🌊',
    url: 'https://copticwave.org/history/index.htm',
    highlight: 'تاريخ الكنيسة والقديسين',
  },
  {
    id: 'martyrs21-memorial',
    name: 'شهداء ليبيا الـ21 — ذكرى الاستشهاد',
    description: 'الشهداء الأقباط الواحد والعشرون الذين استُشهدوا في ليبيا عام 2015 — مُدرَجون في السنكسار القبطي.',
    icon: '✝️',
    url: 'https://st-takla.org/Saints/Coptic-Orthodox-Saints-Biography/Coptic-Saints-Story_2160.html',
    highlight: 'مُدرَجون رسمياً في السنكسار',
  },
  {
    id: 'orsozox-saints',
    name: 'المكتبة القبطية OrSoZoX — سير القديسين',
    description: 'المكتبة الشاملة للكنيسة القبطية الأرثوذكسية — قسم سير القديسين والشهداء والآباء.',
    icon: '🏛️',
    url: 'https://orsozox.com',
    highlight: 'مكتبة شاملة متعددة الأقسام',
  },
];

// ── مردات الشماس ───────────────────────────────────────────────────────────────
export interface DeaconResponse {
  arabic: string;
  coptic?: string;
  meaning: string;
  usage: string;
}

export interface DeaconSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  responses: DeaconResponse[];
}

// ── تفاسير الكتاب المقدس ──────────────────────────────────────────────────────
export interface BibleCommentaryBook {
  title: string;
  url: string;
  category?: string;
}

export interface BibleCommentator {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
  booksNote?: string;
  coverage: string;
  collectionUrl: string;
  source: string;
  color: string;
  books?: BibleCommentaryBook[];
}

export const bibleCommentators: BibleCommentator[] = [
  {
    id: 'tadros-malaty',
    name: 'القمص تادرس يعقوب ملطي',
    title: 'رئيس دير مارجرجس — المحلة الكبرى',
    icon: '📖',
    description: 'أكثر مفسري الكتاب المقدس في الكنيسة القبطية خصوبةً وعمقاً. كتب تفاسير مطولة لمعظم أسفار العهد القديم والجديد تجمع بين الروحانية والعلم اللاهوتي. جميع تفاسيره متاحة مجاناً على الإنترنت.',
    booksNote: '70+ كتاباً وتفسيراً',
    coverage: 'معظم أسفار العهد القديم والجديد',
    collectionUrl: 'https://coptic-treasures.com/person/tadros-malaty/all-material/',
    source: 'مشروع الكنوز القبطية — مجاناً',
    color: 'blue',
  },
  {
    id: 'antonios-fekry',
    name: 'القمص أنطونيوس فكري',
    title: 'خادم ومفسر الكتاب المقدس',
    icon: '✍️',
    description: 'من أبرز مفسري الكتاب المقدس في الكنيسة القبطية. كتب تفاسير وافية لأسفار العهد القديم والجديد بأسلوب علمي وروحي. جميع كتبه متاحة للتحميل مجاناً.',
    booksNote: '40+ كتاباً',
    coverage: 'أسفار العهد القديم والجديد كاملاً',
    collectionUrl: 'https://library.awtar-alsama.com/a-88/',
    source: 'مكتبة أوتار السماء — مجاناً',
    color: 'green',
    books: [
      { title: 'تفسير سفر التكوين', url: 'https://library.awtar-alsama.com/88-032/', category: 'العهد القديم' },
      { title: 'تفسير سفر الخروج', url: 'https://library.awtar-alsama.com/88-079/', category: 'العهد القديم' },
      { title: 'تفسير سفر اللاويين', url: 'https://library.awtar-alsama.com/88-036/', category: 'العهد القديم' },
      { title: 'تفسير سفر العدد', url: 'https://library.awtar-alsama.com/88-037/', category: 'العهد القديم' },
      { title: 'تفسير سفر التثنية', url: 'https://library.awtar-alsama.com/88-038/', category: 'العهد القديم' },
      { title: 'تفسير سفر يشوع', url: 'https://library.awtar-alsama.com/88-039/', category: 'العهد القديم' },
      { title: 'حياة المسيح وزمانه', url: 'https://library.awtar-alsama.com/88-002/', category: 'العهد الجديد' },
      { title: 'أسرار الكنيسة السبعة', url: 'https://library.awtar-alsama.com/88-001/', category: 'لاهوت' },
      { title: 'قطمارس الأحاد', url: 'https://library.awtar-alsama.com/88-081/', category: 'طقسي' },
      { title: 'قطمارس الصوم الكبير', url: 'https://library.awtar-alsama.com/88-080/', category: 'طقسي' },
      { title: 'قطمارس أسبوع الآلام', url: 'https://library.awtar-alsama.com/88-083/', category: 'طقسي' },
      { title: 'المجموعة الكاملة', url: 'https://library.awtar-alsama.com/a-88/', category: 'مجموعة' },
    ],
  },
];

export interface CommentaryResource {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  badge?: string;
}

export const commentaryResources: CommentaryResource[] = [
  {
    id: 'coptic-treasures-tafseer',
    name: 'الكنوز القبطية — دراسات كتابية',
    description: 'مكتبة رقمية شاملة للدراسات الكتابية والتفاسير من آباء الكنيسة القبطية — مجانية بالكامل.',
    url: 'https://coptic-treasures.com/main-category/%D8%AF%D8%B1%D8%A7%D8%B3%D8%A7%D8%AA-%D9%83%D8%AA%D8%A7%D8%A8%D9%8A%D8%A9/',
    icon: '💎',
    badge: 'مجاني',
  },
  {
    id: 'christianlib-tafseer',
    name: 'موسوعة تفاسير الكتاب المقدس PDF',
    description: 'أكبر مكتبة عربية لتفاسير الكتاب المقدس بصيغة PDF — تضم تفاسير من مؤلفين متعددين للعهدين.',
    url: 'https://www.christianlib.com/10651.html/%D8%AA%D8%AD%D9%85%D9%8A%D9%84-%D9%85%D9%83%D8%AA%D8%A8%D8%A9-%D8%AA%D9%81%D8%A7%D8%B3%D9%8A%D8%B1-%D8%A7%D9%84%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D9%85%D9%82%D8%AF%D8%B3-pdf/',
    icon: '📚',
    badge: 'تحميل PDF',
  },
  {
    id: 'gotquestions-arabic',
    name: 'GotQuestions بالعربي — 7,869 سؤالاً كتابياً',
    description: 'أكبر موقع لإجابة أسئلة الكتاب المقدس بالعربية — يغطي آلاف الأسئلة اللاهوتية والكتابية.',
    url: 'https://www.gotquestions.org/Arabic/',
    icon: '❓',
    badge: '7,869 سؤال',
  },
  {
    id: 'awtar-alsama-lib',
    name: 'مكتبة أوتار السماء — تفاسير ودراسات',
    description: 'مكتبة رقمية مجانية تضم مئات الكتب القبطية الأرثوذكسية بصيغة PDF — قراءة أونلاين أو تحميل.',
    url: 'https://library.awtar-alsama.com/',
    icon: '🎵',
    badge: 'أونلاين + PDF',
  },
];

// ── كتب البابا شنودة الثالث ──────────────────────────────────────────────────
export interface PopeShenoudaBook {
  id: string;
  title: string;
  category: string;
  url: string;
  icon: string;
  description: string;
}

export const popeShenoudaBooks: PopeShenoudaBook[] = [
  { id: 'sh-lahoot-masih', title: 'لاهوت المسيح', category: 'لاهوت المسيح', url: 'https://library.awtar-alsama.com/30-001/', icon: '✝️', description: 'دراسة وافية في لاهوت السيد المسيح وألوهيته الكاملة من شواهد الكتاب المقدس' },
  { id: 'sh-tabee3at', title: 'طبيعة المسيح', category: 'لاهوت المسيح', url: 'https://library.awtar-alsama.com/30-002/', icon: '🕊️', description: 'أهم كتاب عقائدي يشرح طبيعة المسيح الواحدة من طبيعتين' },
  { id: 'sh-kanoon', title: 'قانون الإيمان', category: 'عقيدة', url: 'https://library.awtar-alsama.com/30-003/', icon: '📜', description: 'شرح مفصّل لقانون الإيمان النيقاوي وتاريخه ومعناه العقائدي' },
  { id: 'sh-khalas', title: 'الخلاص في المفهوم الأرثوذكسي', category: 'عقيدة', url: 'https://library.awtar-alsama.com/30-004/', icon: '✨', description: 'شرح وافٍ لمفهوم الخلاص في اللاهوت الأرثوذكسي وتمييزه عن المفهوم البروتستانتي' },
  { id: 'sh-kahnooot', title: 'الكهنوت', category: 'عقيدة', url: 'https://library.awtar-alsama.com/30-005/', icon: '⛪', description: 'دراسة عن سر الكهنوت وسلطانه وأهميته في الكنيسة الأرثوذكسية' },
  { id: 'sh-beda3', title: 'بدع حديثة', category: 'لاهوت مقارن', url: 'https://library.awtar-alsama.com/30-006/', icon: '⚠️', description: 'رصد للبدع الحديثة والرد عليها من منظور أرثوذكسي بدليل الكتاب والآباء' },
  { id: 'sh-zawaj', title: 'شريعة الزوجة الواحدة', category: 'لاهوت مقارن', url: 'https://library.awtar-alsama.com/30-007/', icon: '💍', description: 'دراسة في مفهوم الزواج الأحادي في الكنيسة القبطية وأساسه الكتابي' },
  { id: 'sh-moqaran', title: 'اللاهوت المقارن — ج1', category: 'لاهوت مقارن', url: 'https://library.awtar-alsama.com/30-008/', icon: '⚖️', description: 'مقارنة شاملة بين عقائد الكنيسة الأرثوذكسية والكنائس الأخرى' },
  { id: 'sh-shahod', title: 'شهود يهوه وهرطقاتهم', category: 'لاهوت مقارن', url: 'https://library.awtar-alsama.com/30-009/', icon: '🔍', description: 'رد علمي على هرطقات شهود يهوه من الكتاب المقدس وكتابات الآباء' },
  { id: 'sh-khalas-lahza', title: 'بدعة الخلاص في لحظة', category: 'لاهوت مقارن', url: 'https://library.awtar-alsama.com/30-011/', icon: '⏱️', description: 'الرد على عقيدة "الخلاص المضمون" البروتستانتية بالدليل الكتابي والآبائي' },
  { id: 'sh-matar', title: 'لماذا نرفض المطهر', category: 'لاهوت مقارن', url: 'https://library.awtar-alsama.com/30-012/', icon: '🔥', description: 'دراسة نقدية لعقيدة المطهر الكاثوليكية ورفضها من الكتاب والآباء' },
  { id: 'sh-as2ela', title: 'سنوات مع أسئلة الناس — لاهوت ج1', category: 'أسئلة وأجوبة', url: 'https://library.awtar-alsama.com/30-013/', icon: '❓', description: 'إجابات البابا شنودة على أسئلة المؤمنين في العقيدة واللاهوت' },
];

export const shenoudaBookCategories = ['الكل', 'لاهوت المسيح', 'عقيدة', 'لاهوت مقارن', 'أسئلة وأجوبة'];

// ── مصادر المكتبة القبطية الشاملة ────────────────────────────────────────────
export interface CopticLibrarySource {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  highlight: string;
  booksCount?: string;
}

export const copticLibrarySources: CopticLibrarySource[] = [
  {
    id: 'awtar-alsama-shenouda',
    name: 'مكتبة أوتار السماء — كتب البابا شنودة',
    description: 'جميع كتب البابا شنودة الثالث بصيغة PDF يمكن قراءتها أونلاين أو تحميلها مجاناً بدون قيود.',
    url: 'https://library.awtar-alsama.com/a-30/',
    icon: '👑',
    highlight: 'PDF مجاني — تحميل وقراءة أونلاين',
    booksCount: '30+ كتاباً',
  },
  {
    id: 'awtar-alsama-fekry',
    name: 'مكتبة أوتار السماء — القمص أنطونيوس فكري',
    description: 'جميع كتابات القمص أنطونيوس فكري بصيغة PDF — تفاسير للعهدين وكتب طقسية ولاهوتية.',
    url: 'https://library.awtar-alsama.com/a-88/',
    icon: '✍️',
    highlight: 'تفاسير كاملة للعهدين',
    booksCount: '40+ كتاباً',
  },
  {
    id: 'coptic-treasures-pope',
    name: 'الكنوز القبطية — البابا شنودة الثالث',
    description: 'فهرس موضوعات كتب وعظات قداسة البابا شنودة الثالث — مكتبة رقمية شاملة ومصنّفة بالموضوع.',
    url: 'https://coptic-treasures.com/person/117-pope-shenouda-iii/all-material/',
    icon: '💎',
    highlight: 'مصنّفة بالموضوع',
    booksCount: 'مئات المحاضرات والكتب',
  },
  {
    id: 'archive-shenouda',
    name: 'Archive.org — مجموعة كتب البابا شنودة',
    description: 'مجموعة ضخمة من كتب قداسة البابا شنودة الثالث على الإنترنت أرشيف — مفتوحة المصدر مجاناً.',
    url: 'https://archive.org/details/20211021_20211021_0858',
    icon: '🏛️',
    highlight: 'مفتوح المصدر — Archive.org',
    booksCount: 'عشرات الكتب',
  },
  {
    id: 'coptic-treasures-all',
    name: 'مشروع الكنوز القبطية — المكتبة الكاملة',
    description: 'مكتبة رقمية ضخمة للكنيسة القبطية — كتب، عظات، تفاسير، ألحان، صوتيات مجانية.',
    url: 'https://coptic-treasures.com/',
    icon: '📚',
    highlight: 'مكتبة شاملة لكل الأقسام',
  },
  {
    id: 'christianlib',
    name: 'مكتبة الكتب المسيحية',
    description: 'أكبر مكتبة إلكترونية عربية للكتب المسيحية — تحميل مجاني لمئات الكتب الأرثوذكسية.',
    url: 'https://www.christianlib.com/',
    icon: '📖',
    highlight: 'تحميل مجاني — مئات الكتب',
  },
];

// ── خرائط الكتاب المقدس ──────────────────────────────────────────────────────
// ── خريطة الكتاب المقدس التفاعلية المدمجة ────────────────────────────────────
export interface BibleLocation {
  id: string;
  name: string;
  nameAlt?: string;
  lat: number;
  lng: number;
  testament: 'قديم' | 'جديد' | 'كلاهما';
  category: 'مدن' | 'جبال' | 'أنهار وبحار' | 'مناطق';
  description: string;
  verse?: string;
  color: string;
}

export const bibleLocations: BibleLocation[] = [
  // ── مدن العهد القديم ──
  { id: 'jerusalem-ot', name: 'القدس (أورشليم)', lat: 31.7767, lng: 35.2345, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'مدينة داود وعاصمة المملكة الموحدة — مركز العبادة والهيكل المقدس.', verse: '2 صموئيل 5: 7' },
  { id: 'bethlehem', name: 'بيت لحم', lat: 31.7054, lng: 35.2024, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'مسقط رأس داود الملك، ومكان ميلاد يسوع المسيح.', verse: 'ميخا 5: 2 — لوقا 2: 4' },
  { id: 'hebron', name: 'الخليل (حبرون)', lat: 31.5253, lng: 35.0981, testament: 'قديم', category: 'مدن', color: '#6366f1', description: 'مدينة إبراهيم وسارة — مقبرة المكفيلة حيث دُفن آباء الإيمان.', verse: 'تكوين 23: 19' },
  { id: 'jericho', name: 'أريحا', lat: 31.8667, lng: 35.4500, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'أقدم مدينة في العالم — سقط سورها بمعجزة في عهد يشوع، وزارها يسوع وزكا.', verse: 'يشوع 6: 20 — لوقا 19: 1' },
  { id: 'beersheba', name: 'بئر سبع', lat: 31.2524, lng: 34.7916, testament: 'قديم', category: 'مدن', color: '#6366f1', description: 'الحدود الجنوبية لأرض الميعاد — مكان معاهدة إبراهيم وأبيمالك.', verse: 'تكوين 21: 31' },
  { id: 'samaria', name: 'السامرة (شكيم)', lat: 32.2707, lng: 35.1972, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'عاصمة مملكة إسرائيل الشمالية — المكان الذي يلقى فيه يسوع المرأة السامرية.', verse: 'يوحنا 4: 5' },
  { id: 'nazareth', name: 'الناصرة', lat: 32.7021, lng: 35.2978, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'مدينة نشأة يسوع — حيث أعلن بداية رسالته في المجمع.', verse: 'لوقا 4: 16' },
  { id: 'capernaum', name: 'كفرناحوم', lat: 32.8805, lng: 35.5748, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'مركز خدمة يسوع في الجليل — دعا هنا بطرس وأندراوس وياقوب ويوحنا.', verse: 'متى 4: 13' },
  { id: 'bethany', name: 'بيت عنيا', lat: 31.7658, lng: 35.2648, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'بيت لعازر ومريم ومرثا — هنا أقام يسوع لعازر من الموت.', verse: 'يوحنا 11: 1' },
  { id: 'cana', name: 'قانا الجليل', lat: 32.7572, lng: 35.3489, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'موقع أول معجزة يسوع — تحويل الماء إلى خمر في عرس قانا.', verse: 'يوحنا 2: 1' },
  { id: 'gaza', name: 'غزة', lat: 31.5017, lng: 34.4674, testament: 'قديم', category: 'مدن', color: '#6366f1', description: 'إحدى مدن الفلسطيين — ارتبطت بقصة شمشون البطل.', verse: 'قضاة 16: 21' },
  { id: 'nablus', name: 'نابلس (شكيم)', lat: 32.2211, lng: 35.2544, testament: 'قديم', category: 'مدن', color: '#6366f1', description: 'حيث اشترى إبراهيم قطعة الأرض الأولى في كنعان.', verse: 'تكوين 33: 19' },
  { id: 'megiddo', name: 'مجدو (أرمجدون)', lat: 32.5837, lng: 35.1838, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'مدينة الملوك الاستراتيجية — ذُكرت في سفر الرؤيا كموقع المعركة الأخيرة.', verse: 'رؤيا 16: 16' },
  { id: 'antioch', name: 'أنطاكية السورية', lat: 36.2021, lng: 36.1603, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'حيث سُمّي التلاميذ "مسيحيين" للمرة الأولى — انطلق منها بولس في رحلاته التبشيرية.', verse: 'أعمال 11: 26' },
  { id: 'damascus', name: 'دمشق', lat: 33.5138, lng: 36.2765, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'هنا اعترضه يسوع الممجد وتحوّل من اضطهاد المسيحيين إلى أعظم رسله.', verse: 'أعمال 9: 3' },
  { id: 'babylon', name: 'بابل', lat: 32.5355, lng: 44.4275, testament: 'قديم', category: 'مدن', color: '#6366f1', description: 'إمبراطورية نبوخذنصر الكبرى — سبى فيها يهوذا 70 عاماً.', verse: 'دانيال 1: 1' },
  { id: 'nineveh', name: 'نينوى', lat: 36.3590, lng: 43.1590, testament: 'قديم', category: 'مدن', color: '#6366f1', description: 'عاصمة آشور العظيمة — أُرسل إليها يونان فتابت المدينة بأكملها.', verse: 'يونان 1: 2' },
  { id: 'ur', name: 'أور الكلدانيين', lat: 30.9625, lng: 46.1039, testament: 'قديم', category: 'مدن', color: '#6366f1', description: 'مسقط رأس إبراهيم أبو الآباء — الذي غادرها مطيعاً لنداء الله.', verse: 'تكوين 11: 31' },
  { id: 'corinth', name: 'كورنثوس', lat: 37.9379, lng: 22.9316, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'أقام بولس فيها 18 شهراً وكتب إليها رسالتين هما أهم رسائله.', verse: 'أعمال 18: 1' },
  { id: 'ephesus', name: 'أفسس', lat: 37.9500, lng: 27.3667, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'حيث خدم بولس 3 سنوات وأحرق المؤمنون كتب السحر بقيمة 50000 درهم.', verse: 'أعمال 19: 19' },
  { id: 'rome', name: 'روما', lat: 41.9028, lng: 12.4964, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'عاصمة الإمبراطورية — كتب إليها بولس رسالة الرومية وبشّر فيها حتى استشهاده.', verse: 'رومية 1: 7' },
  { id: 'athens', name: 'أثينا', lat: 37.9838, lng: 23.7275, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'مركز الفلسفة اليونانية — خطب فيها بولس في الأريوباغوس عن "الإله المجهول".', verse: 'أعمال 17: 22' },
  { id: 'philippi', name: 'فيلبي', lat: 41.0135, lng: 24.2862, testament: 'جديد', category: 'مدن', color: '#10b981', description: 'أول كنيسة في أوروبا — أسّسها بولس حيث التقى ليدية وأُودع السجن وانفتحت أبوابه.', verse: 'أعمال 16: 12' },
  { id: 'alexandria', name: 'الإسكندرية', lat: 31.2001, lng: 29.9187, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'بوابة مصر الكبرى — أسّسها مارمرقس الرسول أول كنيسة في أفريقيا.', verse: 'أعمال 18: 24' },
  { id: 'cairo-egypt', name: 'مصر (القاهرة)', lat: 30.0444, lng: 31.2357, testament: 'كلاهما', category: 'مدن', color: '#f59e0b', description: 'ملجأ إبراهيم ومهد موسى — ثم مهجر العائلة المقدسة وأرض الكنيسة القبطية.', verse: 'متى 2: 13' },

  // ── جبال ──
  { id: 'mt-sinai', name: 'جبل سيناء (الطور)', lat: 28.5389, lng: 33.9753, testament: 'قديم', category: 'جبال', color: '#8b5cf6', description: 'حيث تجلّى الله لموسى وأعطاه الوصايا العشر ومواعيد الميثاق.', verse: 'خروج 19: 20' },
  { id: 'mt-ararat', name: 'جبل أراراط', lat: 39.7020, lng: 44.2990, testament: 'قديم', category: 'جبال', color: '#8b5cf6', description: 'حيث استقرّت سفينة نوح بعد الطوفان العظيم.', verse: 'تكوين 8: 4' },
  { id: 'mt-carmel', name: 'جبل الكرمل', lat: 32.7351, lng: 35.0628, testament: 'قديم', category: 'جبال', color: '#8b5cf6', description: 'موقع تحدّي إيليا النبي لأنبياء البعل — ونزول النار الإلهية.', verse: '1 ملوك 18: 19' },
  { id: 'mt-tabor', name: 'جبل تابور', lat: 32.6862, lng: 35.3918, testament: 'كلاهما', category: 'جبال', color: '#8b5cf6', description: 'جبل التجلّي — حيث تجلّى يسوع أمام بطرس ويعقوب ويوحنا وظهر موسى وإيليا.', verse: 'متى 17: 1' },
  { id: 'mt-hermon', name: 'جبل حرمون', lat: 33.4109, lng: 35.8580, testament: 'كلاهما', category: 'جبال', color: '#8b5cf6', description: 'أعلى جبل في منطقة فلسطين التاريخية — مصدر نهر الأردن.', verse: 'مزمور 133: 3' },
  { id: 'mt-olives', name: 'جبل الزيتون', lat: 31.7781, lng: 35.2461, testament: 'كلاهما', category: 'جبال', color: '#8b5cf6', description: 'حيث صلّى يسوع في جثسيماني وصعد إلى السماء — ومكان النبوة عن المجيء الثاني.', verse: 'أعمال 1: 12' },

  // ── أنهار وبحار ──
  { id: 'river-jordan', name: 'نهر الأردن', lat: 31.8437, lng: 35.5449, testament: 'كلاهما', category: 'أنهار وبحار', color: '#0891b2', description: 'عبره الشعب إلى أرض الميعاد — وفيه عمّد يوحنا المسيح وانفتحت السماء.', verse: 'يشوع 3: 17 — متى 3: 13' },
  { id: 'sea-galilee', name: 'بحيرة طبريا (الجليل)', lat: 32.8314, lng: 35.5921, testament: 'جديد', category: 'أنهار وبحار', color: '#0891b2', description: 'حيث دعا يسوع التلاميذ ومشى على الماء وأهدأ العواصف ومشى على أمواجها.', verse: 'متى 14: 25' },
  { id: 'dead-sea', name: 'البحر الميت', lat: 31.5, lng: 35.5, testament: 'قديم', category: 'أنهار وبحار', color: '#0891b2', description: 'أخفض نقطة في الأرض — بالقرب منه كانت سدوم وعمورة.', verse: 'تكوين 19: 24' },
  { id: 'river-nile', name: 'نهر النيل', lat: 30.0000, lng: 31.2000, testament: 'قديم', category: 'أنهار وبحار', color: '#0891b2', description: 'مهد الحضارة المصرية — وجد فيه موسى طفلاً في السلّة وتحوّل إلى دم عند الضربات.', verse: 'خروج 2: 3 — خروج 7: 20' },
  { id: 'mediterranean', name: 'البحر الأبيض المتوسط', lat: 34.0, lng: 28.0, testament: 'كلاهما', category: 'أنهار وبحار', color: '#0891b2', description: 'طريق التجارة والتبشير — أبحر فيه بولس في رحلاته الثلاث ونجا من غرق قرب مالطا.', verse: 'أعمال 27: 44' },
  { id: 'red-sea', name: 'البحر الأحمر', lat: 27.0, lng: 33.5, testament: 'قديم', category: 'أنهار وبحار', color: '#0891b2', description: 'شقّه موسى بعصاه وعبر منه الشعب على اليابسة وغرق فيه فرعون وجيشه.', verse: 'خروج 14: 21' },

  // ── مناطق ──
  { id: 'canaan', name: 'أرض كنعان (أرض الميعاد)', lat: 31.8, lng: 35.0, testament: 'قديم', category: 'مناطق', color: '#d97706', description: 'الأرض التي وعد الله بها إبراهيم وذريته — امتدت من نهر مصر إلى الفرات.', verse: 'تكوين 15: 18' },
  { id: 'galilee', name: 'الجليل', lat: 32.8, lng: 35.3, testament: 'كلاهما', category: 'مناطق', color: '#d97706', description: 'إقليم شمال فلسطين — حيث قضى يسوع معظم خدمته وأجرى معظم معجزاته.', verse: 'متى 4: 23' },
  { id: 'judea', name: 'اليهودية', lat: 31.5, lng: 35.1, testament: 'كلاهما', category: 'مناطق', color: '#d97706', description: 'إقليم جنوب فلسطين — وطن يهوذا وموطن بيت داود ومسقط رأس يسوع.', verse: 'متى 2: 1' },
  { id: 'sinai-region', name: 'شبه جزيرة سيناء', lat: 29.5, lng: 33.5, testament: 'قديم', category: 'مناطق', color: '#d97706', description: 'صحراء التيه — تاه فيها الشعب 40 سنة يتعلّم الإيمان والطاعة.', verse: 'خروج 16: 1' },
  { id: 'greece', name: 'اليونان (مقدونية)', lat: 40.5, lng: 22.5, testament: 'جديد', category: 'مناطق', color: '#d97706', description: 'انتشرت فيها الكنيسة الأولى — كورنثوس وأثينا وفيلبي وتسالونيكي وبيرية.', verse: 'أعمال 16: 9' },
];

export type BibleLocationCategory = 'الكل' | 'مدن' | 'جبال' | 'أنهار وبحار' | 'مناطق';
export type BibleLocationTestament = 'الكل' | 'قديم' | 'جديد' | 'كلاهما';
export const bibleLocationCategories: BibleLocationCategory[] = ['الكل', 'مدن', 'جبال', 'أنهار وبحار', 'مناطق'];

// kept for backward compat (external links no longer used)
export interface BibleMapResource {
  id: string; name: string; description: string; url: string; icon: string;
  testament: 'قديم' | 'جديد' | 'كلاهما'; badge?: string;
}
export const bibleMapResources: BibleMapResource[] = [];

// ── مردات الشماس ───────────────────────────────────────────────────────────────
// جميع النصوص تراث طقسي قبطي أرثوذكسي — مُحمَّل مباشرةً على الموقع
export const deaconSections: DeaconSection[] = [
  {
    id: 'general',
    title: 'المردات العامة المتكررة',
    icon: '🔔',
    color: 'amber',
    description: 'هذه المردات تتكرر كثيراً في القداس والصلوات اليومية ويُشارك فيها الشعب جميعاً. هي أساس المشاركة الجماعية في الطقس القبطي.',
    responses: [
      {
        arabic: 'كيريه إليسون',
        coptic: 'Ⲕⲩⲣⲓⲉ ⲉ̀ⲗⲉⲏⲥⲟⲛ',
        meaning: 'يا رب ارحم',
        usage: 'أكثر المردات تكراراً في القداس الإلهي وجميع الطقوس. تُقال 41 مرة عند تقديم الحمل.',
      },
      {
        arabic: 'آمين',
        coptic: 'Ⲁ̀ⲙⲏⲛ',
        meaning: 'حقاً / هكذا يكون',
        usage: 'يُقالها الشماس والشعب في نهاية كل صلاة وأوشية وقراءة مقدسة.',
      },
      {
        arabic: 'آمين، آمين، آمين',
        coptic: 'Ⲁ̀ⲙⲏⲛ ⲁ̀ⲙⲏⲛ ⲁ̀ⲙⲏⲩ',
        meaning: 'ثلاثة آمين تأكيداً للإيمان بالثالوث القدوس',
        usage: 'تُقال قبل تلاوة مرد الاعتراف "أؤمن، أؤمن، أؤمن" عند الاستعداد للتناول.',
      },
      {
        arabic: 'قدوس، قدوس، قدوس رب الصاباؤوت',
        coptic: 'Ⲁ̀ⲅⲓⲟⲥ Ⲁ̀ⲅⲓⲟⲥ Ⲁ̀ⲅⲓⲟⲥ',
        meaning: 'قدوس رب الجنود — ملء السماء والأرض مجده',
        usage: 'يُقالها الشماس والشعب عقب الـ 41 كيرياليسون في تقديم الحمل.',
      },
      {
        arabic: 'هلليلويا',
        coptic: 'Ⲁ̀ⲗⲗⲏⲗⲟⲩⲓⲁ',
        meaning: 'سبّحوا الرب — (عبرانية: هَلَّل يَهْوَه)',
        usage: 'ترنيمة تسبيح تُقال في كثير من مواضع القداس والتسبحة وخاصة في أوقات الفرح.',
      },
      {
        arabic: 'له المجد',
        meaning: 'نسبة المجد لله وحده',
        usage: 'تُقال في نهاية المزامير والتسابيح والأناشيد الروحية، ردٌّ على كل ما يُذكر من أعمال الله.',
      },
      {
        arabic: 'الرب يُشفيك',
        meaning: 'طلب الشفاء من الرب',
        usage: 'تُقال في الصلوات المخصصة للمرضى وفي مردات بعض الطقوس.',
      },
      {
        arabic: 'يا رب ارحمنا',
        meaning: 'طلب الرحمة الجماعية',
        usage: 'ترداد جماعي في الصلوات والأوشيات، يعبّر عن احتياج الشعب لرحمة الله.',
      },
    ],
  },
  {
    id: 'incense',
    title: 'مردات رفع البخور',
    icon: '🕯️',
    color: 'orange',
    description: 'مردات خدمة الشماس في رفع بخور عشية وباكر — تسبق القداس الإلهي وتُرتَّل أثناء صعود البخور أمام الهيكل.',
    responses: [
      {
        arabic: 'بسم الآب والابن والروح القدس إله واحد، آمين',
        meaning: 'افتتاح الخدمة باسم الثالوث الأقدس',
        usage: 'تُقال في بداية كل خدمة دينية وعند قرع أرباع الناقوس.',
      },
      {
        arabic: 'قوموا للصلاة',
        coptic: 'Ⲓⲑⲛⲁⲩ ⲉⲣⲟϥ',
        meaning: 'دعوة الشعب للوقوف في هيبة أمام الرب',
        usage: 'يقولها الشماس عند بداية الصلاة أو القراءة أو الإنجيل.',
      },
      {
        arabic: 'ننصتوا جميعاً بتقوى',
        meaning: 'دعوة للانتباه والتقوى أثناء الصلاة',
        usage: 'ينبّه الشماس الشعب بها على بدء الأوشية أو القراءة.',
      },
      {
        arabic: 'صلّوا من أجل الإنجيل المقدس',
        meaning: 'دعوة الشعب للصلاة من أجل إعلان كلمة الله',
        usage: 'يقولها الشماس قبل قراءة الإنجيل في رفع البخور.',
      },
      {
        arabic: 'لأن الكاهن رافع البخور يسأل المسيح إلهنا أن يقبل بخورنا ذبيحة روحية مقبولة لدى عرشه السماوي',
        meaning: 'طلب قبول البخور ذبيحةً روحية',
        usage: 'يُقالها الشماس أثناء صعود البخور قبل الهيكل عشية وباكر.',
      },
      {
        arabic: 'اللهم صلّ على نبيّك وعبدك موسى النبي',
        meaning: 'ذكر الأنبياء والقديسين في الصلاة',
        usage: 'تُقال في الأوشيات المخصصة لذكر الآباء والأنبياء خلال رفع البخور.',
      },
      {
        arabic: 'اشفعي فينا يا والدة الإله العذراء مريم',
        meaning: 'طلب شفاعة السيدة العذراء',
        usage: 'تُقال في مرد الثيؤطوكية المخصصة للسيدة العذراء أثناء رفع البخور.',
      },
      {
        arabic: 'يا رب اقبل منا هذا البخور رائحة طيبة',
        meaning: 'طلب قبول البخور كصلاة وعبادة',
        usage: 'يقولها الكاهن والشعب أثناء رفع المجمرة أمام الهيكل المقدس.',
      },
    ],
  },
  {
    id: 'liturgy',
    title: 'مردات القداس الإلهي',
    icon: '⛪',
    color: 'purple',
    description: 'المردات التي يرددها الشماس والشعب أثناء القداس الإلهي — مرتبة حسب تسلسلها الطقسي من الافتتاح حتى الاختتام.',
    responses: [
      {
        arabic: 'إن صوفيا ثيؤ',
        coptic: 'Ⲉⲛⲥⲟⲫⲓⲁ Ⲑⲉⲟⲩ',
        meaning: 'انصتوا بحكمة الله',
        usage: 'يقولها الشماس قبل قراءة الرسالة لتنبيه الشعب للانتباه لكلمة الله.',
      },
      {
        arabic: 'بروسخومين',
        coptic: 'Ⲡ̀ⲣⲟⲥⲭⲱⲙⲉⲛ',
        meaning: 'ننصت / ننتبه',
        usage: 'يقولها الشعب رداً على دعوة الشماس للانتباه والانصات.',
      },
      {
        arabic: 'أسباذيستيه أليلوس',
        coptic: 'Ⲁⲥⲡⲁⲍⲉⲥⲑⲉ ⲁⲗⲗⲏⲗⲟⲩⲥ',
        meaning: 'قبّلوا بعضكم بعضاً',
        usage: 'يدعو الشماس الشعب لتبادل قبلة السلام قبل صلاة الصلح.',
      },
      {
        arabic: 'إيس أناتولاس فليفساتي',
        coptic: 'Ⲓⲥ ⲁ̀ⲛⲁⲧⲟⲗⲁⲥ ⲃ̀ⲗⲉⲯⲁⲧⲉ',
        meaning: 'وإلى الشرق انظروا',
        usage: 'يوجّه الشماس الشعب لاستقبال القبلة نحو الشرق رمز مجيء المسيح.',
      },
      {
        arabic: 'اسجدوا لإنجيل ربنا يسوع المسيح',
        meaning: 'دعوة لتعظيم الإنجيل المقدس قبل قراءته',
        usage: 'يقولها الكاهن قبل قراءة الإنجيل فيردّ الشماس والشعب بكيرياليسون ثلاثاً.',
      },
      {
        arabic: 'مكسوم إكسيوس',
        coptic: 'Ⲙⲁⲝⲁⲓⲟⲩ ⲁⲝⲓⲟⲥ',
        meaning: 'مستحق — يُبارك الله هذا المستحق',
        usage: 'يُقالها الشماس والشعب عند إعلان أي تكريس أو رسامة في الكنيسة.',
      },
      {
        arabic: 'ولك ينبغي المجد والإكرام والسجود',
        meaning: 'تقديم المجد لله الثالوث',
        usage: 'يُقالها الشماس والشعب تكميلاً لتسبحة القداس الإلهي.',
      },
      {
        arabic: 'اشكروا الرب لأنه صالح',
        meaning: 'دعوة لشكر الله على صلاحه وعطاياه',
        usage: 'يُقالها الشماس في نهاية القداس دعوةً للشكر والتسبيح.',
      },
      {
        arabic: 'لأن رحمته إلى الأبد',
        meaning: 'إعلان رحمة الله الأبدية',
        usage: 'يردّ الشعب بها على دعوة الشكر في نهاية القداس.',
      },
    ],
  },
  {
    id: 'confession',
    title: 'مرد الاعتراف والتناول',
    icon: '🕊️',
    color: 'blue',
    description: 'المردات التي تُقال وقت الاستعداد للتناول من الأسرار المقدسة — اعترافاً بالإيمان واتضاعاً أمام الرب.',
    responses: [
      {
        arabic: 'أؤمن، أؤمن، أؤمن أن هذا هو بالحقيقة جسدك ودمك يا مسيح ملكنا وإلهنا',
        coptic: 'ϯⲛⲁϩϯ ϯⲛⲁϩϯ ϯⲛⲁϩϯ ϫⲉ ϧⲉⲛ ⲟⲩⲙⲉⲑⲙⲏⲓ',
        meaning: 'اعتراف بحضور المسيح الحقيقي في الأسرار المقدسة',
        usage: 'يقولها الشماس والشعب عند استعدادهم للتناول من جسد المسيح ودمه.',
      },
      {
        arabic: 'آمين — هلليلويا',
        coptic: 'Ⲁ̀ⲙⲏⲛ — Ⲁ̀ⲗⲗⲏⲗⲟⲩⲓⲁ',
        meaning: 'آمين — سبّحوا الرب',
        usage: 'يُقالها الشماس والشعب عند توزيع الأسرار المقدسة.',
      },
      {
        arabic: 'ليكن لنا بحسب إيمانك يا رب',
        meaning: 'طلب العمل بحسب إيمان المؤمنين',
        usage: 'تُقال عند التناول من الأسرار المقدسة تضرعاً واتضاعاً.',
      },
      {
        arabic: 'قدسٌ للآب، قدسٌ للابن، قدسٌ للروح القدس',
        meaning: 'تقديس الثالوث الأقدس قبل التناول',
        usage: 'تُقال مباشرة قبل التناول من الأسرار المقدسة تعبيراً عن الإيمان بالثالوث.',
      },
      {
        arabic: 'الجسد والدم الطاهر لابن الله يُقدَّمان إليّ، آمين',
        meaning: 'استقبال الأسرار المقدسة بإيمان وتواضع',
        usage: 'يقولها الشخص عند تناوله من الأسرار المقدسة.',
      },
    ],
  },
  {
    id: 'tasbeha',
    title: 'مردات التسبحة اليومية',
    icon: '🌙',
    color: 'indigo',
    description: 'مردات التسبحة القبطية اليومية (صلاة نصف الليل) — التي يُرتّلها الشمامسة والشعب في تسبحة نصف الليل والصباح.',
    responses: [
      {
        arabic: 'مزمور، مزمور، مزمور لداود النبي وملك إسرائيل',
        meaning: 'إعلان بدء التسبيح بمزامير داود',
        usage: 'تُقال في بداية التسبحة قبل ترتيل المزامير.',
      },
      {
        arabic: 'إبسالي إبسالي إبسالي',
        coptic: 'Ⲯⲁⲗⲓ ⲯⲁⲗⲓ ⲯⲁⲗⲓ',
        meaning: 'رنّموا رنّموا رنّموا — دعوة للتسبيح',
        usage: 'يُقالها الشماس في بداية كل مزمور دعوةً للشعب للتسبيح بالمزامير.',
      },
      {
        arabic: 'تنيشورين إيفيوفيلي',
        coptic: 'Ⲧⲉⲛϣⲱⲣⲡ ⲉ̀ϩⲟⲩⲛ ⲉ̀ⲫⲓⲟϣ',
        meaning: 'نقدم بواكير المزامير — أول المزامير',
        usage: 'يُقالها في بداية مزمور التسبحة عند الدخول في صلاة مزمور باكر.',
      },
      {
        arabic: 'تينيف تينيف تينيف — مبارك الرب إله إسرائيل',
        coptic: 'Ⲧⲉⲛⲱϣ ⲛ̀ⲉⲟⲟⲩ',
        meaning: 'نسبّح نسبّح نسبّح — ترديد التسبيح ثلاثاً',
        usage: 'يُقالها الشماس دعوةً للتسبيح الجماعي في التسبحة القبطية.',
      },
      {
        arabic: 'آبيه أبسي — أيها الحمل الذي رفع خطية العالم',
        coptic: 'Ⲁ̀ⲫⲏⲣⲓ ⲁ̀ⲃⲉⲥ',
        meaning: 'يا حمل الله الذي رفع خطايا العالم',
        usage: 'يُقالها الشماس والشعب في التسبحة ردًّا على ترتيل المزامير.',
      },
      {
        arabic: 'أنيكي إكسيوس',
        coptic: 'Ⲁ̀ⲛⲓⲕⲓ ⲁ̀ⲝⲓⲟⲥ',
        meaning: 'نقبل — يستحق — نعم يستحق',
        usage: 'تُقال في نهاية كل ترتيلة أو لحن في التسبحة تعبيراً عن الموافقة والقبول.',
      },
    ],
  },
  {
    id: 'agpeya',
    title: 'مردات الأجبية (ساعات الصلاة)',
    icon: '🙏',
    color: 'teal',
    description: 'مردات صلوات الأجبية الكنسي القبطي — الساعات السبع التي يُصلّيها المؤمن طوال اليوم تقديساً لكل لحظة.',
    responses: [
      {
        arabic: 'أشهد بإيمان واعتراف كامل أن هذا هو بالحقيقة جسد المسيح وهذا هو دمه الكريم',
        meaning: 'اعتراف إيمان الكنيسة القبطية بالأسرار',
        usage: 'تُقال في افتتاح كل صلاة من صلوات الأجبية تثبيتاً للإيمان.',
      },
      {
        arabic: 'يا رب يا رب يا رب ارحم',
        meaning: 'نداء الاتكال على الرب والطلب من رحمته',
        usage: 'تُقال في بداية كل صلاة ساعة للتركيز على حضور الله.',
      },
      {
        arabic: 'المجد للآب والابن والروح القدس الآن وكل أوان وإلى دهر الداهرين، آمين',
        meaning: 'تمجيد الثالوث الأقدس',
        usage: 'تُقال في نهاية كل مزمور من مزامير الأجبية وفي نهاية الصلوات.',
      },
      {
        arabic: 'السلام لكم جميعاً',
        meaning: 'تحية السلام المسيحية',
        usage: 'يُقالها الكاهن لبدء الصلاة أو الاجتماع فيردّ الشعب: ولروحك أيضاً.',
      },
      {
        arabic: 'ولروحك أيضاً',
        meaning: 'رد تحية السلام',
        usage: 'يردّها الشعب على تحية الكاهن "السلام لكم" في الأجبية والقداس.',
      },
      {
        arabic: 'الشكر لله',
        meaning: 'شكر الله في كل وقت',
        usage: 'ترداد كثير في الأجبية بعد كل مزمور وفي التحيات تعبيراً عن الشكر الدائم.',
      },
    ],
  },
  {
    id: 'special',
    title: 'مردات مناسبات خاصة',
    icon: '✨',
    color: 'emerald',
    description: 'مردات تُقال في المناسبات الكنسية الخاصة كأسبوع الآلام والقيامة والعيد الكبير والغطاس وأحد الشعانين.',
    responses: [
      {
        arabic: 'المسيح قام من بين الأموات ووطئ الموت بالموت ووهب الحياة للذين في القبور',
        meaning: 'إعلان قيامة المسيح — جوهر الإيمان المسيحي',
        usage: 'تُقال في كل قداسات العيد وطوال خمسين يوماً من عيد القيامة.',
      },
      {
        arabic: 'أوصنا لابن داود، مبارك الآتي باسم الرب، أوصنا في الأعالي',
        meaning: 'ترحيب بالمسيح الملك الداخل — تذكار دخوله أورشليم',
        usage: 'تُقال في أحد الشعانين (أحد السعف) احتفالاً بدخول المسيح أورشليم.',
      },
      {
        arabic: 'الصليب المقدس ظهر لنا نوراً — بارك يا رب',
        meaning: 'تعظيم الصليب المقدس',
        usage: 'تُقال في عيد الصليب وفي طقوس رفع الصليب.',
      },
      {
        arabic: 'هذا النور المقدس',
        meaning: 'الإشارة إلى نور المسيح في طقس إضاءة الشموع',
        usage: 'تُقال في طقس إضاءة شموع السبت المقدس احتفالاً بقيامة المسيح.',
      },
      {
        arabic: 'الرب قد مَلَك ويملك ويملك إلى الأبد',
        meaning: 'إعلان ملوكية الرب الأبدية',
        usage: 'تُقال في عيد الغطاس وفي المناسبات الكبرى للكنيسة.',
      },
      {
        arabic: 'طوبى للذين اختاروا الرحلة إلى السماء',
        meaning: 'تطويب الشهداء والمتنيّحين في إيمان',
        usage: 'تُقال في قداسات عيد الشهداء وفي صلوات الجنازات تذكيراً بالرجاء.',
      },
    ],
  },
];

// ── أسئلة مع البابا شنودة الثالث ─────────────────────────────────────────────
export interface PopeShenoudaQA {
  q: string;
  summary: string;
}

export interface PopeShenoudaQAVideo {
  id: string;
  videoId: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  description: string;
  questions: PopeShenoudaQA[];
}

export const popeShenoudaQAVideos: PopeShenoudaQAVideo[] = [
  {
    id: 'qa-people-varied',
    videoId: 'MO4gQ1I6DNY',
    title: 'سنوات مع أسئلة الناس للبابا شنودة الثالث (تجميعة متنوعة)',
    subtitle: 'أسئلة روحية وعملية متنوعة',
    category: 'روحي وعملي',
    icon: '💡',
    description: 'تجميعة من أسئلة الشعب القبطي التي طُرحت على قداسة البابا شنودة الثالث عبر سنوات — تشمل مواضيع روحية وعقائدية وعملية بأسلوبه الحكيم البسيط.',
    questions: [
      { q: 'ما الحل حين تراودني أفكار الخطيئة أثناء التوبة؟', summary: 'أفكار الشيطان لا تُحتسب خطيئة ما دمت لم تقبلها — الله يعلم القلب، والمقاومة نفسها فضيلة وليست خطيئة.' },
      { q: 'لماذا نسمي الكهنة "أب" رغم قول الكتاب "لا تدعوا أحداً أباً"؟', summary: 'قصد المسيح النهي عن التبنّي الروحي الكامل الذي يُغني عن الله — أما "أب" للمرشد الروحي فهو لقب احترام وخدمة لا عبودية.' },
      { q: 'أين إيليا وأخنوخ اللذان لم يموتا؟ وهل هما في المكان ذاته الذي صعد إليه المسيح؟', summary: 'إيليا وأخنوخ رُفعا بجسد ولم يمرّا بالموت — وهما ينتظران في مكان خاص، ليس السماء النهائية التي صعد إليها المسيح بعد قيامته.' },
      { q: 'هل مهنة المحاماة جائزة للمسيحي إذا كان يدافع عن مذنبين؟', summary: 'المحاماة مهنة مشروعة — المحامي يضمن حق التقاضي العادل لا يصنع البراءة؛ والدفاع عن المتهم لا يعني تبرير خطيئته.' },
      { q: 'كيف خلق الله الإنسان من تراب وروح — وما علاقة ذلك بالملائكة الساقطة؟', summary: 'الإنسان مخلوق مستقل لا علاقة له بالملائكة الساقطة — التراب رمز الجسد المادي، والروح من نفخة الله تمييزاً له عن سائر المخلوقات.' },
    ],
  },
  {
    id: 'qa-people-part5',
    videoId: 'Mgg_SYExZ5g',
    title: 'مع أسئلة الناس — الجزء الخامس',
    subtitle: 'الغيبيات والصلاة عن الأموات والرهبنة',
    category: 'روحي وعملي',
    icon: '🕊️',
    description: 'الجزء الخامس من سلسلة أسئلة الناس للبابا شنودة الثالث — يتناول موضوعات دقيقة: حكم الغيبيات وعلم الكف، والصلاة عن الأموات، والتمييز بين دعوة الرهبنة والزواج.',
    questions: [
      { q: 'هل يجوز قراءة الكف وعلم الغيب حتى للترفيه فقط؟', summary: 'لا يجوز حتى للترفيه — فتح باب الغيبيات يجلب تأثيرات روحية خطيرة، والكتاب المقدس يرفض كل صورها رفضاً قاطعاً.' },
      { q: 'هل الصلاة عن الأموات تنفعهم بعد انتقالهم؟', summary: 'الكنيسة الأرثوذكسية تؤمن بنفع الصلاة للأموات — لأن رحمة الله لا حدود لها، وصلوات الأحبة تصل إليهم بمحبة الله.' },
      { q: 'كيف يعرف الشخص هل دعوته للرهبنة أم للزواج؟', summary: 'الرهبنة دعوة يُحسّها القلب بشوق متواصل للوحدة مع الله — أما الزواج فدعوة طبيعية للأغلبية، ويساعد الأب الروحي في التمييز.' },
    ],
  },
  {
    id: 'qa-confession-father',
    videoId: 'T6YvEuFgpOg',
    title: 'كيف أختار أب اعترافي؟',
    subtitle: 'معايير اختيار الأب الروحي',
    category: 'حياة روحية',
    icon: '🙏',
    description: 'يُجيب البابا شنودة الثالث على سؤال جوهري في الحياة الروحية: كيف تختار أباك الروحي؟ وما هي الصفات التي يجب أن تبحث عنها في المرشد الذي ستأتمنه على حياتك الداخلية؟',
    questions: [
      { q: 'كيف أختار أب اعترافي؟ وما هي الصفات التي يجب أن أبحث عنها؟', summary: 'اختر أباً يعيش ما يعلّم — رجل صلاة وخبرة روحية، يحفظ السر ويتكتم، تشعر معه بالأمان والصدق، ولا يتهرب من مواجهتك بالحق برفق.' },
    ],
  },
];

export const popeShenoudaQACategories = ['الكل', 'روحي وعملي', 'حياة روحية'];
