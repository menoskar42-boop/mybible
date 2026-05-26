import { motion } from 'framer-motion';
import { Home, BookOpen, HandHeart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { usePageTracker } from '@/hooks/usePageTracker';
import { useExitTracker } from '@/hooks/useExitTracker';
import { familyVerses, familyPrayers, familyWorshipIdeas } from '@/lib/family-data';
import FamilyCounseling from '@/components/FamilyCounseling';

const familySEO = {
  title: 'ركن العائلة المسيحية - رفيقي | آيات وصلوات وأفكار للعبادة الأسرية',
  description: 'ركن العائلة المسيحية: آيات عن الأسرة، صلوات الصباح والمساء والطعام، وأفكار عملية للعبادة الأسرية وبناء حياة روحية في البيت.',
  keywords: ['العائلة المسيحية', 'صلوات الأسرة', 'العبادة الأسرية', 'آيات عن الأسرة', 'مذبح العائلة', 'التربية الروحية', 'الأسرة القبطية'],
};

export default function Family() {
  usePageTracker('/family');
  useExitTracker('/family');

  return (
    <>
      <SEOHead dynamicSEO={familySEO} />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">ركن العائلة</h1>
              <p className="text-sm text-muted-foreground">آيات وصلوات وأفكار لبناء حياة روحية في البيت</p>
            </div>
          </div>

          {/* مشورة أسرية — أول الصفحة */}
          <FamilyCounseling />

          {/* آيات عن الأسرة */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" /> آيات عن الأسرة
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {familyVerses.map((v, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 h-full">
                    <p className="font-display text-lg leading-relaxed text-foreground">«{v.text}»</p>
                    <p className="text-sm text-primary mt-2">{v.ref}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* صلوات الأسرة */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-xl">🙏</span> صلوات الأسرة
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {familyPrayers.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-5 text-center h-full">
                    <div className="text-4xl mb-2">{p.emoji}</div>
                    <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* أفكار للعبادة الأسرية */}
          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-emerald-500" /> أفكار للعبادة الأسرية
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {familyWorshipIdeas.map((idea, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-4 flex items-start gap-3 h-full">
                    <span className="text-3xl">{idea.emoji}</span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{idea.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{idea.text}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </>
  );
}
