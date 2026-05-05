import { SEOHead } from '@/components/SEOHead';
import { Card } from '@/components/ui/card';
import { BookOpen, Heart, Users, Shield } from 'lucide-react';

export default function About() {
  const seo = {
    title: 'من نحن | الكتاب المقدس رفيقي',
    description: 'تعرّف على موقع الكتاب المقدس رفيقي، منصة مجانية للقراءة اليومية والتفسير والتعزية الروحية من الكتاب المقدس باللغة العربية.',
    keywords: ['من نحن', 'الكتاب المقدس رفيقي', 'موقع الكتاب المقدس', 'قراءة الكتاب المقدس'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'من نحن - الكتاب المقدس رفيقي',
      description: 'منصة مجانية للقراءة اليومية والتفسير والتعزية الروحية من الكتاب المقدس باللغة العربية.',
      inLanguage: 'ar',
      isPartOf: {
        '@type': 'WebSite',
        name: 'الكتاب المقدس رفيقي'
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <SEOHead dynamicSEO={seo} />
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground" data-testid="text-about-title">من نحن</h1>
            <p className="text-sm text-muted-foreground">تعرّف على الكتاب المقدس رفيقي</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6 text-right leading-loose font-body text-base" dir="rtl">
            <div className="flex items-start gap-3">
              <BookOpen className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-xl font-bold mb-2">رسالتنا</h2>
                <p>
                  الكتاب المقدس رفيقي هو منصة مجانية بالكامل تهدف إلى تشجيع القراءة اليومية للكتاب المقدس باللغة العربية. نؤمن بأن كلمة الله هي نور للحياة ومصدر للتعزية والرجاء، ونسعى لجعلها في متناول الجميع.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-xl font-bold mb-2">ما نقدمه</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>قراءة الكتاب المقدس كاملاً باللغة العربية مع تفسير الآيات والإصحاحات</li>
                  <li>خطط قراءة يومية متعددة (30، 60، 90، 180، 365 يوم)</li>
                  <li>قسم التعزية الروحية مع آيات مصنّفة حسب المشاعر والاحتياجات</li>
                  <li>قصص الكتاب المقدس للأطفال بطريقة مبسطة وممتعة</li>
                  <li>الاستماع لإصحاحات الكتاب المقدس عبر فيديوهات يوتيوب</li>
                  <li>أدوات تظليل الآيات والبحث الذكي</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-xl font-bold mb-2">مبادئنا</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>نحترم قدسية النص الكتابي ولا نُنتج أو نُغيّر أي نص من الكتاب المقدس</li>
                  <li>التفاسير مأخوذة من مصادر موثوقة ومعتمدة</li>
                  <li>الموقع مجاني بالكامل ومتاح للجميع بدون قيود</li>
                  <li>نلتزم بحماية خصوصية المستخدمين</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
