import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { kholagyLiturgies, type KholagyLiturgy, type KholagySection } from '@/lib/kholagy-data';

// ── ألوان الأدوار
const roleColors: Record<string, string> = {
  'الكاهن':  'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  'الشماس':  'bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-200',
  'الشعب':   'bg-teal-100   text-teal-800   dark:bg-teal-900/40   dark:text-teal-200',
  'الكل':    'bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-200',
};

const roleBorder: Record<string, string> = {
  'الكاهن':  'border-r-4 border-purple-400',
  'الشماس':  'border-r-4 border-amber-400',
  'الشعب':   'border-r-4 border-teal-400',
  'الكل':    'border-r-4 border-blue-400',
};

// ── قائمة القداسات (/kholagy)
function LiturgyList() {
  const [, navigate] = useLocation();

  const cardColors: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    purple: {
      border: 'border-purple-300 dark:border-purple-700',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-700 dark:text-purple-300',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    },
    amber: {
      border: 'border-amber-300 dark:border-amber-700',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
    teal: {
      border: 'border-teal-300 dark:border-teal-700',
      bg: 'bg-teal-50 dark:bg-teal-950/20',
      text: 'text-teal-700 dark:text-teal-300',
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    },
  };

  return (
    <>
      <SEOHead dynamicSEO={{
        title: 'الخولاجي المقدس — القداسات القبطية الأرثوذكسية',
        description: 'اقرأ نصوص القداسات القبطية الأرثوذكسية بالعربية: قداس القديس باسيليوس وغريغوريوس وكيرلس كاملاً',
        keywords: ['خولاجي', 'قداس قبطي', 'باسيليوس', 'غريغوريوس', 'كيرلس', 'صلوات قبطية أرثوذكسية'],
      }} />
      <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">الخولاجي المقدس</h1>
          <p className="text-muted-foreground">القداسات القبطية الأرثوذكسية الثلاثة</p>
        </div>

        <div className="space-y-4">
          {kholagyLiturgies.map((lit, i) => {
            const c = cardColors[lit.color] ?? cardColors['purple'];
            return (
              <motion.div
                key={lit.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`p-5 cursor-pointer border-2 hover:shadow-md transition-all ${c.border} ${c.bg}`}
                  onClick={() => navigate(`/kholagy/${lit.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{lit.icon}</div>
                    <div className="flex-1">
                      <h2 className={`font-bold text-lg ${c.text}`}>{lit.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lit.sections.length} قسماً طقسياً
                      </p>
                    </div>
                    <ChevronLeft className={`w-5 h-5 ${c.text}`} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── قارئ القسم الواحد (/kholagy/basil/[sectionId])
function SectionReader({ liturgy, section, sectionIdx }: {
  liturgy: KholagyLiturgy;
  section: KholagySection;
  sectionIdx: number;
}) {
  const [, navigate] = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = navRef.current?.querySelector(`[data-idx="${sectionIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [sectionIdx]);

  const prev = liturgy.sections[sectionIdx - 1];
  const next = liturgy.sections[sectionIdx + 1];
  const borderClass = roleBorder[section.role] ?? 'border-r-4 border-slate-300';
  const badgeClass = roleColors[section.role] ?? 'bg-slate-100 text-slate-700';

  return (
    <>
      <SEOHead dynamicSEO={{
        title: `${section.title} — ${liturgy.name} — الخولاجي المقدس`,
        description: `${section.title} من ${liturgy.name} — نص طقسي قبطي أرثوذكسي كامل بالعربية`,
        keywords: ['خولاجي', 'قداس قبطي', liturgy.name, section.title],
      }} />

      <div className="max-w-2xl mx-auto pb-24" dir="rtl">
        {/* شريط التنقل الثابت */}
        <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
          {/* breadcrumb */}
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => navigate('/kholagy')}
            >
              <ChevronRight className="w-3.5 h-3.5" /> الخولاجي
            </button>
            <span className="text-muted-foreground">›</span>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate(`/kholagy/${liturgy.id}`)}
            >
              {liturgy.name.split(' — ')[0]}
            </button>
          </div>

          {/* تبويبات الأقسام — scrollable */}
          <div ref={navRef} className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 scrollbar-hide">
            {liturgy.sections.map((sec, i) => (
              <button
                key={sec.id}
                data-idx={i}
                onClick={() => navigate(`/kholagy/${liturgy.id}/${sec.id}`, { replace: true })}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  i === sectionIdx
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>
        </div>

        {/* عنوان القسم */}
        <div className={`mx-4 mt-5 mb-4 p-4 rounded-xl ${borderClass} bg-muted/30`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{section.title}</h1>
            <Badge className={`text-xs border-0 ${badgeClass}`}>{section.role}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {sectionIdx + 1} / {liturgy.sections.length}
          </p>
        </div>

        {/* النص */}
        <div className="px-4">
          <div className={`rounded-xl p-5 bg-muted/20 border ${borderClass}`}>
            <p className="text-base leading-9 whitespace-pre-line text-foreground text-right font-medium">
              {section.text}
            </p>
          </div>
        </div>

        {/* تنقل السابق / التالي */}
        <div className="flex items-center justify-between px-4 pt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={!prev}
            onClick={() => {
              if (prev) {
                navigate(`/kholagy/${liturgy.id}/${prev.id}`);
                window.scrollTo(0, 0);
              }
            }}
            className="gap-1"
          >
            <ChevronRight className="w-4 h-4" /> {prev?.title?.substring(0, 12) ?? 'السابق'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!next}
            onClick={() => {
              if (next) {
                navigate(`/kholagy/${liturgy.id}/${next.id}`);
                window.scrollTo(0, 0);
              }
            }}
            className="gap-1"
          >
            {next?.title?.substring(0, 12) ?? 'التالي'} <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ── قائمة أقسام القداس (/kholagy/:liturgyId)
function LiturgySections({ liturgy }: { liturgy: KholagyLiturgy }) {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      <SEOHead dynamicSEO={{
        title: `${liturgy.name} — الخولاجي المقدس`,
        description: `نص ${liturgy.name} الكامل بالعربية — ${liturgy.sections.length} قسماً طقسياً`,
        keywords: ['خولاجي', 'قداس قبطي', liturgy.name],
      }} />

      <div className="max-w-2xl mx-auto pb-16" dir="rtl">
        {/* رأس الصفحة */}
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm px-4 py-3 flex items-center gap-3">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
            onClick={() => navigate('/kholagy')}
          >
            <ChevronRight className="w-4 h-4" /> الخولاجي
          </button>
          <span className="text-muted-foreground">›</span>
          <h1 className="font-bold text-sm text-foreground truncate">{liturgy.name}</h1>
        </div>

        {/* قائمة الأقسام */}
        <div className="px-4 pt-4 space-y-2">
          {liturgy.sections.map((sec, idx) => {
            const isOpen = expandedId === sec.id;
            const badgeClass = roleColors[sec.role] ?? 'bg-slate-100 text-slate-700';
            const borderClass = roleBorder[sec.role] ?? 'border-r-4 border-slate-300';

            return (
              <motion.div
                key={sec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
              >
                <Card className={`overflow-hidden border-0 shadow-sm ${borderClass}`}>
                  {/* رأس القسم */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-right hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedId(isOpen ? null : sec.id)}
                  >
                    <span className="text-xs text-muted-foreground w-6 flex-shrink-0">{idx + 1}</span>
                    <span className="flex-1 font-medium text-sm text-foreground">{sec.title}</span>
                    <Badge className={`text-xs border-0 flex-shrink-0 ${badgeClass}`}>{sec.role}</Badge>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    }
                  </button>

                  {/* معاينة + زر القراءة الكاملة */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                          {/* معاينة أول 200 حرف */}
                          <p className="text-sm leading-7 text-muted-foreground line-clamp-3 text-right">
                            {sec.text.substring(0, 200)}...
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1 text-xs"
                            onClick={() => navigate(`/kholagy/${liturgy.id}/${sec.id}`)}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            قراءة القسم كاملاً
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── الصفحة الرئيسية
export default function KholagyPro() {
  const { liturgyId, chapterId } = useParams<{ liturgyId?: string; chapterId?: string }>();

  if (!liturgyId) return <LiturgyList />;

  const liturgy = kholagyLiturgies.find(l => l.id === liturgyId);
  if (!liturgy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 py-16" dir="rtl">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">هذا القداس غير موجود</p>
        <Button variant="outline" onClick={() => window.location.href = '/kholagy'}>
          العودة للخولاجي
        </Button>
      </div>
    );
  }

  if (!chapterId) return <LiturgySections liturgy={liturgy} />;

  const sectionIdx = liturgy.sections.findIndex(s => s.id === chapterId);
  if (sectionIdx === -1) return <LiturgySections liturgy={liturgy} />;

  return (
    <SectionReader
      liturgy={liturgy}
      section={liturgy.sections[sectionIdx]}
      sectionIdx={sectionIdx}
    />
  );
}
