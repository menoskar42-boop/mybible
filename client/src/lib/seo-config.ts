export interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
  schema?: object;
}

export const pageSEOConfig: Record<string, PageSEO> = {
  '/': {
    title: 'الكتاب المقدس | قراءة، تفسير، خطط قراءات يومية',
    description: 'موقع الكتاب المقدس العربي للقراءة اليومية، التفسير، الخطط الروحية، وقسم الأطفال.',
    keywords: ['الكتاب المقدس', 'الإنجيل', 'قراءة يومية', 'تعزية روحية', 'آيات الكتاب المقدس', 'العهد الجديد', 'العهد القديم', 'oscardevs', 'mybible.oscardevs.com', 'oscardevs.com'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'الكتاب المقدس رفيقي',
      description: 'موقع الكتاب المقدس العربي للقراءة اليومية، التفسير، الخطط الروحية، وقسم الأطفال.',
      applicationCategory: 'ReligiousApplication',
      operatingSystem: 'Web',
      inLanguage: 'ar',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    }
  },
  '/kids': {
    title: 'قصص الكتاب المقدس للأطفال | فيديوهات وقصص مسيحية',
    description: 'قصص الكتاب المقدس للأطفال بطريقة مبسطة تشمل العهد القديم والجديد.',
    keywords: ['قصص أطفال مسيحية', 'قصص الكتاب المقدس للأطفال', 'حكايات الإنجيل', 'قصص يسوع للأطفال', 'تعليم ديني للأطفال'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'قصص الكتاب المقدس للأطفال',
      description: 'قصص الكتاب المقدس للأطفال بطريقة مبسطة تشمل العهد القديم والجديد.',
      inLanguage: 'ar',
      isPartOf: {
        '@type': 'WebApplication',
        name: 'الكتاب المقدس رفيقي'
      }
    }
  },
  '/emotions': {
    title: 'التغذية الروحية | آيات الكتاب المقدس حسب مشاعرك',
    description: 'اعثر على آيات الكتاب المقدس التي تناسب مشاعرك. آيات للتعزية عند الحزن، القوة عند الخوف، والأمل عند اليأس.',
    keywords: ['آيات تعزية', 'آيات للحزن', 'آيات للخوف', 'آيات الأمل', 'دعم روحي', 'تغذية روحية'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'التغذية الروحية من الكتاب المقدس',
      description: 'آيات الكتاب المقدس مصنفة حسب المشاعر والاحتياجات الروحية',
      inLanguage: 'ar',
      author: {
        '@type': 'Organization',
        name: 'الكتاب المقدس رفيقي'
      }
    }
  },
  '/plans': {
    title: 'خطط قراءة الكتاب المقدس | 30، 60، 90، 180 يوم',
    description: 'خطط قراءات يومية للكتاب المقدس تساعدك على الاستمرار في القراءة الروحية.',
    keywords: ['خطة قراءة الكتاب المقدس', 'قراءة الإنجيل', 'جدول قراءة الكتاب المقدس', 'خطط قراءات يومية'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'خطط قراءة الكتاب المقدس',
      description: 'خطط قراءات يومية للكتاب المقدس تساعدك على الاستمرار في القراءة الروحية.',
      inLanguage: 'ar',
      step: [
        {
          '@type': 'HowToStep',
          name: 'اختر خطة القراءة',
          text: 'اختر خطة مناسبة لوقتك: 30 أو 60 أو 90 أو 180 يوم'
        },
        {
          '@type': 'HowToStep',
          name: 'اقرأ يومياً',
          text: 'التزم بالقراءة اليومية حسب الجدول المحدد'
        },
        {
          '@type': 'HowToStep',
          name: 'تابع تقدمك',
          text: 'شاهد تقدمك وأكمل الخطة بنجاح'
        }
      ]
    }
  },
  '/bible': {
    title: 'الكتاب المقدس كاملاً بالعربية | العهد القديم والجديد مع التفسير',
    description: 'اقرأ الكتاب المقدس كاملاً باللغة العربية مع تفسير الآيات والاستماع للإصحاحات.',
    keywords: ['الكتاب المقدس بالعربي', 'الإنجيل', 'العهد القديم', 'العهد الجديد', 'تفسير الكتاب المقدس', 'قراءة الكتاب المقدس'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: 'الكتاب المقدس',
      inLanguage: 'ar',
      bookFormat: 'https://schema.org/EBook',
      numberOfPages: 1189,
      genre: 'Religious text'
    }
  },
  '/search': {
    title: 'بحث في الكتاب المقدس | البحث في آيات الكتاب المقدس',
    description: 'ابحث في آيات الكتاب المقدس باللغة العربية. بحث ذكي في العهد القديم والجديد.',
    keywords: ['بحث الكتاب المقدس', 'بحث في الإنجيل', 'آيات الكتاب المقدس'],
  },
  '/highlights': {
    title: 'آياتي المظللة | الكتاب المقدس رفيقي',
    description: 'آياتك المفضلة والمظللة من الكتاب المقدس.',
    keywords: ['آيات مفضلة', 'الكتاب المقدس'],
  },
  '/about': {
    title: 'من نحن | الكتاب المقدس رفيقي',
    description: 'تعرّف على موقع الكتاب المقدس رفيقي، منصة مجانية للقراءة اليومية والتفسير والتعزية الروحية من الكتاب المقدس باللغة العربية.',
    keywords: ['من نحن', 'الكتاب المقدس رفيقي', 'موقع الكتاب المقدس'],
  },
  '/privacy': {
    title: 'سياسة الخصوصية | الكتاب المقدس رفيقي',
    description: 'سياسة الخصوصية لموقع الكتاب المقدس رفيقي. تعرّف على كيفية حماية بياناتك وخصوصيتك.',
    keywords: ['سياسة الخصوصية', 'حماية البيانات', 'الكتاب المقدس رفيقي'],
  },
  '/contact': {
    title: 'تواصل معنا | الكتاب المقدس رفيقي',
    description: 'تواصل مع فريق الكتاب المقدس رفيقي للاستفسارات والملاحظات والاقتراحات.',
    keywords: ['تواصل معنا', 'اتصل بنا', 'الكتاب المقدس رفيقي'],
  },
  '/orthodox': {
    title: 'أرثوذوكسيات | سنكسار، أجبية، خولاجي المقدس، ألحان قبطية، قطمارس، سير القديسين والشهداء الأقباط',
    description: 'قسم أرثوذوكسيات الشامل: سنكسار اليوم، كتاب الأجبية (ساعات الصلاة السبع)، الخولاجي المقدس (قداس باسيليوس وغريغوريوس وكيرلس)، كتب الألحان القبطية والإبصلمودية، القطمارس والقراءات اليومية، مردات الشماس، وسير القديسين والشهداء الأقباط الأرثوذكس.',
    keywords: [
      'سنكسار اليوم', 'الأجبية القبطية', 'كتاب الأجبية', 'ساعات الصلاة السبع',
      'خولاجي مقدس', 'قداس باسيليوس', 'قداس غريغوريوس', 'قداس كيرلس',
      'ألحان قبطية', 'الإبصلمودية', 'تسبحة قبطية', 'كتب الألحان القبطية',
      'القطمارس', 'قراءات يومية قبطية', 'القراءات الليتورجية',
      'مردات الشماس', 'كيرياليسون', 'مرد الاعتراف', 'مردات رفع البخور',
      'سير القديسين الأقباط', 'شهداء الأقباط', 'شهداء ليبيا',
      'الكنيسة القبطية الأرثوذكسية', 'طقوس قبطية', 'صلاة قبطية', 'أرثوذكسية قبطية',
    ],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'أرثوذوكسيات — الكتاب المقدس رفيقي',
      description: 'سنكسار اليوم، كتاب الأجبية، الخولاجي المقدس، كتب الألحان القبطية والإبصلمودية، القطمارس، مردات الشماس، وسير القديسين والشهداء الأقباط الأرثوذكس.',
      inLanguage: 'ar',
      about: { '@type': 'Thing', name: 'الكنيسة القبطية الأرثوذكسية' },
      isPartOf: { '@type': 'WebApplication', name: 'الكتاب المقدس رفيقي' },
    }
  },
};

export function getBibleBookSEO(bookName: string, chaptersCount: number): PageSEO {
  return {
    title: `تفسير ${bookName} كامل | قراءة ودراسة | الكتاب المقدس رفيقي`,
    description: `تفسير ${bookName} كامل مع مقدمة عن السفر، قراءة مباشرة، واستماع صوتي لكل إصحاح. يحتوي على ${chaptersCount} إصحاح.`,
    keywords: [bookName, `تفسير ${bookName}`, `سفر ${bookName}`, 'الكتاب المقدس', 'تفسير', 'قراءة الكتاب المقدس'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: bookName,
      inLanguage: 'ar',
      about: 'الكتاب المقدس',
      numberOfPages: chaptersCount,
      url: `https://mybible.oscardevs.com/bible?book=${encodeURIComponent(bookName)}`,
      publisher: {
        '@type': 'Organization',
        name: 'الكتاب المقدس رفيقي',
        url: 'https://mybible.oscardevs.com'
      }
    }
  };
}

export function getBibleChapterSEO(bookName: string, chapter: number): PageSEO {
  return {
    title: `تفسير ${bookName} الإصحاح ${chapter} | قراءة الإصحاح كامل`,
    description: `اقرأ تفسير ${bookName} الإصحاح ${chapter} كامل مع إمكانية الاستماع والمشاركة.`,
    keywords: [bookName, `تفسير ${bookName} ${chapter}`, `الإصحاح ${chapter}`, 'الكتاب المقدس', 'تفسير', 'قراءة الكتاب المقدس'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `تفسير ${bookName} الإصحاح ${chapter}`,
      description: `اقرأ تفسير ${bookName} الإصحاح ${chapter} كامل مع إمكانية الاستماع والمشاركة.`,
      inLanguage: 'ar',
      url: `https://mybible.oscardevs.com/bible?book=${encodeURIComponent(bookName)}&chapter=${chapter}`,
      isPartOf: {
        '@type': 'Book',
        name: bookName,
        inLanguage: 'ar',
        about: 'الكتاب المقدس'
      },
      publisher: {
        '@type': 'Organization',
        name: 'الكتاب المقدس رفيقي',
        url: 'https://mybible.oscardevs.com'
      }
    }
  };
}

export function getTafsirSEO(bookName: string, chapter: number): PageSEO {
  return {
    title: `تفسير ${bookName} الإصحاح ${chapter} | تفسير الكتاب المقدس`,
    description: `تفسير ${bookName} الإصحاح ${chapter} من الكتاب المقدس اعتمادًا على مصادر تفسير موثوقة. شرح وافٍ لكل آية.`,
    keywords: [bookName, `تفسير ${bookName} ${chapter}`, `تفسير الإصحاح ${chapter}`, 'تفسير الكتاب المقدس'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `تفسير ${bookName} الإصحاح ${chapter}`,
      description: `تفسير شامل لإصحاح ${chapter} من سفر ${bookName} في الكتاب المقدس`,
      inLanguage: 'ar',
      author: {
        '@type': 'Organization',
        name: 'الكتاب المقدس رفيقي'
      },
      articleSection: 'تفسير الكتاب المقدس'
    }
  };
}

export function getVerseTafsirSEO(bookName: string, chapter: number, verse: number): PageSEO {
  return {
    title: `تفسير ${bookName} ${chapter}:${verse} | تفسير الكتاب المقدس`,
    description: `تفسير الآية ${verse} من ${bookName} الإصحاح ${chapter} من الكتاب المقدس.`,
    keywords: [bookName, `تفسير الآية ${verse}`, 'تفسير الكتاب المقدس'],
  };
}

export function getBookIntroSEO(bookName: string): PageSEO {
  return {
    title: `مقدمة عن سفر ${bookName} | الكتاب المقدس`,
    description: `مقدمة وتعريف بسفر ${bookName} من الكتاب المقدس.`,
    keywords: [bookName, 'مقدمة', 'الكتاب المقدس'],
  };
}

export function getVideoSchema(videos: Array<{id: string; title: string; youtubeId: string; description?: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'فيديوهات الكتاب المقدس للأطفال',
    description: 'مجموعة فيديوهات تعليمية عن قصص الكتاب المقدس للأطفال',
    numberOfItems: videos.length,
    itemListElement: videos.slice(0, 10).map((video, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoObject',
        name: video.title,
        description: video.description || video.title,
        thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
        uploadDate: '2024-01-01',
        inLanguage: 'ar'
      }
    }))
  };
}
