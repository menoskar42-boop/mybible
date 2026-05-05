export interface KidsVideo {
  id: string;
  title: string;
  youtubeId: string;
  keywords: string[];
  category: string;
}

const kidsStoriesVideos: KidsVideo[] = [
  {
    id: "adam-eve",
    title: "حكاية آدم وحواء وبداية الخليقة",
    youtubeId: "R2qW0MJlbEI",
    keywords: ["آدم", "حواء", "الخليقة", "البداية", "الله"],
    category: "قصص العهد القديم"
  },
  {
    id: "noah-ark",
    title: "حكاية فلك نوح",
    youtubeId: "s8YQNIJ0tOI",
    keywords: ["نوح", "الفلك", "الطوفان", "الطاعة"],
    category: "قصص العهد القديم"
  },
  {
    id: "cain-abel",
    title: "حكاية قايين وهابيل",
    youtubeId: "i_15QL9gr4k",
    keywords: ["قايين", "هابيل", "المحبة", "الغيرة"],
    category: "قصص العهد القديم"
  },
  {
    id: "abraham-2",
    title: "حكاية إبراهيم أبو الآباء (الجزء الثاني)",
    youtubeId: "LBndqPUDD1Y",
    keywords: ["إبراهيم", "الإيمان", "الطاعة"],
    category: "قصص العهد القديم"
  },
  {
    id: "abraham-3",
    title: "حكاية إبراهيم أبو الآباء (الجزء الثالث)",
    youtubeId: "RbdvcoL6mM8",
    keywords: ["إبراهيم", "الوعد", "البركة"],
    category: "قصص العهد القديم"
  },
  {
    id: "isaac-jacob",
    title: "حكاية أبونا إسحق (ولادة يعقوب وعيسو)",
    youtubeId: "j99239YwVLE",
    keywords: ["إسحق", "يعقوب", "عيسو", "العائلة"],
    category: "قصص العهد القديم"
  },
  {
    id: "joseph-1",
    title: "حكاية يوسف البار (الجزء الأول)",
    youtubeId: "SJh4Mzy9eWs",
    keywords: ["يوسف", "الأمانة", "الصبر"],
    category: "قصص العهد القديم"
  },
  {
    id: "joseph-full",
    title: "فيلم كارتون يوسف الصديق كامل",
    youtubeId: "JWuaAa1_h5U",
    keywords: ["يوسف", "الغفران", "حلم"],
    category: "قصص العهد القديم"
  },
  {
    id: "david-goliath",
    title: "حكاية داود وجليات",
    youtubeId: "V-7KjSTUos8",
    keywords: ["داود", "جليات", "الشجاعة", "الإيمان"],
    category: "قصص العهد القديم"
  },
  {
    id: "jonah-whale",
    title: "حكاية يونان النبي والحوت",
    youtubeId: "Zq3r8FcqL2A",
    keywords: ["يونان", "الحوت", "التوبة"],
    category: "قصص العهد القديم"
  },
  {
    id: "daniel-1",
    title: "دانيال والثلاثة فتية (الجزء الأول)",
    youtubeId: "A8Iy7kuWeUA",
    keywords: ["دانيال", "الإيمان", "الأمانة"],
    category: "سلسلة حكايات دانيال النبي"
  },
  {
    id: "daniel-2",
    title: "الثلاثة فتية في آتون النار (الجزء الثاني)",
    youtubeId: "PxoTqaXXOow",
    keywords: ["آتون النار", "حماية الله"],
    category: "سلسلة حكايات دانيال النبي"
  },
  {
    id: "daniel-4",
    title: "دانيال في جب الأسود (الجزء الرابع)",
    youtubeId: "j4n9NsUh_nw",
    keywords: ["دانيال", "الأسود", "الثقة بالله"],
    category: "سلسلة حكايات دانيال النبي"
  },
  {
    id: "susanna",
    title: "حكاية سوسنة العفيفة (الجزء الخامس)",
    youtubeId: "89aKXVr98D4",
    keywords: ["سوسنة", "الطهارة", "الحق"],
    category: "سلسلة حكايات دانيال النبي"
  },
  {
    id: "bel-dragon",
    title: "حكاية بال والتنين (الجزء السادس)",
    youtubeId: "KlqK8WyvqvA",
    keywords: ["دانيال", "عبادة الله"],
    category: "سلسلة حكايات دانيال النبي"
  },
  {
    id: "christmas",
    title: "حكاية البشارة وميلاد السيد المسيح",
    youtubeId: "v-NU3KQL-MM",
    keywords: ["ميلاد يسوع", "البشارة", "الفرح"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "zechariah",
    title: "حكاية زكريا وأليصابات ويوحنا المعمدان",
    youtubeId: "WuEZsF1xr24",
    keywords: ["زكريا", "أليصابات", "يوحنا المعمدان"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "samaritan-woman",
    title: "حكاية المرأة السامرية",
    youtubeId: "7FwucHOtrTU",
    keywords: ["السامرية", "المحبة", "الخلاص"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "prodigal-son",
    title: "حكاية الابن الضال",
    youtubeId: "QpwDhPGe42Q",
    keywords: ["الابن الضال", "التوبة", "الغفران"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "lost-sheep",
    title: "حكاية الخروف الضال",
    youtubeId: "fe7XLX0erfk",
    keywords: ["الخروف الضال", "الراعي الصالح"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "lost-coin",
    title: "حكاية الدرهم المفقود",
    youtubeId: "XfukQUCWwvg",
    keywords: ["الدرهم المفقود", "البحث", "الفرح"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "parables-collection",
    title: "تجميعة (الابن الضال والخروف الضال والدرهم المفقود)",
    youtubeId: "VED1O-La-xA",
    keywords: ["أمثال المسيح", "التوبة", "المحبة"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "zacchaeus-tax-collector",
    title: "قصة زكّا العشار - اتغير لما شاف يسوع",
    youtubeId: "bnCtTi9zuo0",
    keywords: ["زكا", "زكّا", "العشار", "يسوع", "التوبة", "التغيير", "الخلاص", "كرتون"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "lent-sunday-temptation",
    title: "أحد التجربة - كيف نقاوم الشيطان وننتصر؟",
    youtubeId: "WLJr2brdnqg",
    keywords: ["الصوم الكبير", "التجربة", "الشيطان", "الانتصار", "يسوع", "الإيمان"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "lent-sunday-prodigal-son",
    title: "أحد الابن الضال - قصة التوبة والغفران",
    youtubeId: "c6GnSqeOqro",
    keywords: ["الصوم الكبير", "الابن الضال", "التوبة", "الغفران", "الأب", "العودة"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "lent-sunday-samaritan-woman",
    title: "أحد السامرية - قصة المرأة السامرية عند البئر",
    youtubeId: "AyhGAxM-7js",
    keywords: ["الصوم الكبير", "السامرية", "البئر", "يسوع", "الخلاص", "الماء الحي"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "lent-sunday-paralyzed-man",
    title: "أحد المخلع - يسوع يشفي مريض بركة بيت حسدا",
    youtubeId: "9JC_LVWQVmU",
    keywords: ["الصوم الكبير", "المخلع", "الشفاء", "بيت حسدا", "يسوع", "المعجزة"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "lent-sunday-blind-man",
    title: "أحد المولود أعمى - معجزة شفاء المولود أعمى",
    youtubeId: "iQuzUBh37Vs",
    keywords: ["الصوم الكبير", "المولود أعمى", "الشفاء", "يسوع", "المعجزة", "النور"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "lent-sunday-treasures",
    title: "أحد الكنوز - قصة الكنز الحقيقي في الصوم الكبير",
    youtubeId: "9dmp4h8vq8k",
    keywords: ["الصوم الكبير", "الكنز", "السماء", "الأولويات", "القلب"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "lent-sunday-palm-sunday",
    title: "أحد الشعانين - دخول يسوع أورشليم بالتهليل",
    youtubeId: "Rbt8Xrat7Bg",
    keywords: ["الصوم الكبير", "الشعانين", "أورشليم", "يسوع", "الزعف", "التهليل"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "lent-sunday-resurrection",
    title: "المسيح قام! - أحد القيامة المجيد",
    youtubeId: "JI9ZUeQgOrM",
    keywords: ["القيامة", "المسيح قام", "الفصح", "الحياة", "النور", "الانتصار", "الموت اتهزم"],
    category: "سلسلة آحاد الصوم الكبير"
  },
  {
    id: "creation-in-the-beginning",
    title: "في البدء خلق الله! - أيام الخليقة",
    youtubeId: "0V6kHypl99w",
    keywords: ["الخليقة", "في البدء", "الله", "السماء", "الأرض", "الكون", "الأيام السبعة"],
    category: "قصص العهد القديم"
  },
  {
    id: "adam-eve-the-fall",
    title: "قصة آدم وحواء وسر السقوط",
    youtubeId: "1ZwC1GRhPMI",
    keywords: ["آدم", "حواء", "السقوط", "قايين", "هابيل", "الجنة", "الخطية"],
    category: "قصص العهد القديم"
  },
  {
    id: "noah-rainbow",
    title: "قصة نوح وقوس قزح",
    youtubeId: "6Ngitlk-trI",
    keywords: ["نوح", "قوس قزح", "الفلك", "الطوفان", "الوعد", "الله"],
    category: "قصص العهد القديم"
  },
  {
    id: "jonah-whale",
    title: "يونان النبي في بطن الحوت وتوبة أهل نينوى",
    youtubeId: "LVM61hA6a78",
    keywords: ["يونان", "الحوت", "نينوى", "التوبة", "الطاعة", "النبي", "العناية"],
    category: "قصص العهد القديم"
  },
  {
    id: "jonah-song",
    title: "ترنيمة يونان والحوت",
    youtubeId: "QpBise28R6c",
    keywords: ["يونان", "الحوت", "ترنيمة", "أغنية", "نينوى", "أطفال"],
    category: "قصص العهد القديم"
  },
  {
    id: "daniel-lions-den",
    title: "دانيال في جب الأسود - الشجاعة والثقة بالله",
    youtubeId: "hKG81Cq31fY",
    keywords: ["دانيال", "الأسود", "الإيمان", "الشجاعة", "الله", "الحماية", "جب الأسود"],
    category: "سلسلة حكايات دانيال النبي"
  },
  {
    id: "birth-of-jesus",
    title: "ميلاد الرب يسوع المسيح - أول يوم في حياة بابا يسوع",
    youtubeId: "G_JdJv3CgaA",
    keywords: ["ميلاد", "يسوع", "المسيح", "الكريسماس", "المغارة", "المجوس", "الرعاة"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "healing-lame-beautiful-gate",
    title: "شفاء الأعرج عند باب جميل - معجزة بطرس ويوحنا",
    youtubeId: "dLfk0zsseYE",
    keywords: ["الأعرج", "باب جميل", "بطرس", "يوحنا", "الشفاء", "المعجزة", "الرسل"],
    category: "حكايات من العهد الجديد وأمثال السيد المسيح"
  },
  {
    id: "virgin-mary-ascension",
    title: "قصة اصعاد جسد العذراء وازاي توما شافها",
    youtubeId: "2vmjXE7YBGU",
    keywords: ["العذراء", "مريم", "الاصعاد", "توما", "الرسول", "المعجزة"],
    category: "قصص العذراء والقديسين"
  },
  {
    id: "virgin-mary-childhood",
    title: "طفولة العذراء مريم وسر الطاعة في الهيكل",
    youtubeId: "y9obyQovTkQ",
    keywords: ["العذراء", "مريم", "الطفولة", "الهيكل", "الطاعة", "الله"],
    category: "قصص العذراء والقديسين"
  },
  {
    id: "virgin-mary-matias",
    title: "معجزة حل الحديد - العذراء مريم والقديس متياس الرسول",
    youtubeId: "ydUII1eWT8Q",
    keywords: ["العذراء", "مريم", "متياس", "الرسول", "المعجزة", "الحديد"],
    category: "قصص العذراء والقديسين"
  },
  {
    id: "saints-marina-damiana",
    title: "أسماء الشهيدات القديسات - مارينا ودميانة ومهرائيل",
    youtubeId: "AfDz0OERSmk",
    keywords: ["مارينا", "دميانة", "مهرائيل", "شهيدات", "قديسات", "الإيمان", "الاستشهاد"],
    category: "قصص العذراء والقديسين"
  },
  {
    id: "child-martyrs-heroes",
    title: "أطفال شهداء أبطال - أصغر أبطال الإيمان",
    youtubeId: "H6IH0wXhTnI",
    keywords: ["شهداء", "أطفال", "أبطال", "الإيمان", "الشجاعة", "القديسين"],
    category: "قصص العذراء والقديسين"
  },
  {
    id: "king-constantine-cross",
    title: "الملك قسطنطين وظهور الصليب - كيف عرف المسيح",
    youtubeId: "ErVIRIjy7vc",
    keywords: ["قسطنطين", "الصليب", "المسيحية", "الإيمان", "التاريخ", "الظهور"],
    category: "قصص العذراء والقديسين"
  },
  {
    id: "queen-helena-holy-cross",
    title: "قصة الملكة هيلانة واكتشاف الصليب المقدس",
    youtubeId: "j3ah-89V-Ok",
    keywords: ["هيلانة", "الصليب المقدس", "القدس", "الاكتشاف", "المعجزة", "التاريخ"],
    category: "قصص العذراء والقديسين"
  },
  {
    id: "nayrouz-adventures",
    title: "مغامرات مريم في عيد النيروز مع الشخصيات المسحورة",
    youtubeId: "BO363fOIkFM",
    keywords: ["النيروز", "السنة القبطية", "مريم", "مغامرات", "عيد", "أطفال"],
    category: "قصص وأناشيد متنوعة"
  },
  {
    id: "what-is-bible-keraза",
    title: "ما هو الكتاب المقدس؟ - محفوظات مهرجان الكرازة 2025",
    youtubeId: "CtirGbkt9PY",
    keywords: ["الكتاب المقدس", "الكرازة", "محفوظات", "تعليمي", "الكنيسة", "الكلمة"],
    category: "قصص وأناشيد متنوعة"
  }
];

// ── ترانيم للأطفال ────────────────────────────────────────────────────────
// ترانيم مصرية حديثة مشهورة من قنوات: الحياة الأفضل أطفال وكوجي TV
const kidsHymns: KidsVideo[] = [
  {
    id: "hymn-jesus-loves-me-cartoon",
    title: "ربي يسوع بيحبني (كارتون)",
    youtubeId: "Q4u8LMyEsiI",
    keywords: ["ترنيمة", "يسوع بيحبني", "كارتون", "الحياة الأفضل", "محبة"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-if-you-love-jesus",
    title: "إن كنت تحب يسوع قول آمين (كارتون)",
    youtubeId: "a5WrYXgVd9s",
    keywords: ["ترنيمة", "إن كنت تحب يسوع", "آمين", "كارتون", "الحياة الأفضل"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-jesus-teach-me",
    title: "ربي يسوع علمني",
    youtubeId: "8J63MAsoelA",
    keywords: ["ترنيمة", "ربي يسوع علمني", "تعليم", "الحياة الأفضل", "أطفال"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-god-called-me",
    title: "ربنا كلمني - موسى أنا عايزك إنت",
    youtubeId: "-rqW2WQiHBA",
    keywords: ["ترنيمة", "ربنا كلمني", "موسى", "دعوة", "الحياة الأفضل", "أطفال"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-jesus-in-our-home",
    title: "يسوع في بيتنا",
    youtubeId: "G9r0Rd9sZuQ",
    keywords: ["ترنيمة", "يسوع في بيتنا", "البيت", "الحياة الأفضل", "أطفال"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-his-name-is-jesus",
    title: "اسمه يسوع",
    youtubeId: "Fb2J_KZCTvI",
    keywords: ["ترنيمة", "اسمه يسوع", "اسم", "الحياة الأفضل", "تسبيح"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-great-is-our-lord",
    title: "عظيم هو ربنا",
    youtubeId: "GeHDDPRsmj8",
    keywords: ["ترنيمة", "عظيم هو ربنا", "تعبد", "الحياة الأفضل", "تسبيح"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-holy-spirit",
    title: "روح الله القدوس",
    youtubeId: "xIvb7i50KEw",
    keywords: ["ترنيمة", "روح القدس", "الله القدوس", "الحياة الأفضل", "عبادة"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-ana-farhan",
    title: "أنا فرحان (بالحركات)",
    youtubeId: "RHD08VjiooI",
    keywords: ["ترنيمة", "أنا فرحان", "فرح", "حركات", "أطفال"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-khelik-shagara",
    title: "خليك شجرة (كارتون)",
    youtubeId: "wAp76FaQt3o",
    keywords: ["ترنيمة", "خليك شجرة", "كارتون", "نمو", "أطفال", "2024"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-ana-momayaz",
    title: "أنا مميز",
    youtubeId: "eoW3qD_bkOE",
    keywords: ["ترنيمة", "أنا مميز", "هوية", "أطفال", "2023"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-atalammt",
    title: "اتعلمت - كورال الملائكة بنها",
    youtubeId: "WDaHVGM9XOA",
    keywords: ["ترنيمة", "اتعلمت", "كورال", "كوجي", "الملائكة", "بنها"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-ana-shaghal",
    title: "أنا شغال - كورال الملائكة بنها",
    youtubeId: "-uUSU-LVYo0",
    keywords: ["ترنيمة", "أنا شغال", "كورال", "كوجي", "خدمة"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-salaamna-elaiky",
    title: "سلامنا اليكِ (كارتون)",
    youtubeId: "cuN_6Jj3Kaw",
    keywords: ["ترنيمة", "سلامنا اليكى", "كارتون", "كوجي", "العذراء"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-oaa-tekol",
    title: "أوعى تقول",
    youtubeId: "bUzUUPVgDng",
    keywords: ["ترنيمة", "أوعى تقول", "كوجي", "أطفال", "إيمان"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-etmasek",
    title: "إتمسك اللي عندك",
    youtubeId: "EigsIr3VNMw",
    keywords: ["ترنيمة", "إتمسك اللي عندك", "كوجي", "ثبات", "إيمان"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-asahsah",
    title: "أصحصح وأكون مستعد - قيثارة كيدز",
    youtubeId: "H6og_wKrF6k",
    keywords: ["ترنيمة", "أصحصح", "مستعد", "قيثارة كيدز", "كوجي", "استعداد"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-sabah-el-kheir",
    title: "صباح الخير يا بابا يسوع",
    youtubeId: "QlcnGtNH7As",
    keywords: ["ترنيمة", "صباح الخير", "يا بابا يسوع", "صباح", "صلاة"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-enta-azeem",
    title: "إنت عظيم - فريق بيكوجى أنجيلوس",
    youtubeId: "_tMPWSGEu_U",
    keywords: ["ترنيمة", "إنت عظيم", "كوجي", "تسبيح", "مجد"],
    category: "ترانيم للأطفال",
  },
  {
    id: "hymn-milad-el-masih",
    title: "قصة ميلادك يا يسوع مش أي قصة (بالحركات)",
    youtubeId: "sOxYBvaGi_s",
    keywords: ["ترنيمة", "ميلاد يسوع", "الكريسماس", "بالحركات", "عيد"],
    category: "ترانيم للأطفال",
  },
];

// Combined list: hymns first, then stories/videos
export const kidsBibleVideos: KidsVideo[] = [...kidsHymns, ...kidsStoriesVideos];

// Export hymns separately for playlist feature
export const kidsHymnsPlaylist: KidsVideo[] = kidsHymns;

export const videoCategories = [
  "قصص العهد القديم",
  "سلسلة حكايات دانيال النبي",
  "حكايات من العهد الجديد وأمثال السيد المسيح",
  "سلسلة آحاد الصوم الكبير",
  "قصص العذراء والقديسين",
  "قصص وأناشيد متنوعة",
  "ترانيم للأطفال",
];

export function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
}

export function searchVideos(query: string): KidsVideo[] {
  if (!query.trim()) return kidsBibleVideos;
  const lowerQuery = query.toLowerCase();
  return kidsBibleVideos.filter(video =>
    video.title.toLowerCase().includes(lowerQuery) ||
    video.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
  );
}
