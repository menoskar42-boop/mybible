import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePageTracker } from '@/hooks/usePageTracker';
import { agpeyaHoursFull, commonOpeningPrayers } from '@/lib/agpeya-content';

export default function OrthodoxAgpeyaHour() {
  const { hour: hourId } = useParams<{ hour: string }>();
  usePageTracker(`/orthodox/agpeya/${hourId}`);

  const hour = agpeyaHoursFull.find(h => h.id === hourId);

  if (!hour) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center" dir="rtl">
        <p className="text-muted-foreground">لم يتم العثور على هذه الساعة.</p>
        <Link href="/orthodox/agpeya" className="text-primary underline mt-4 block">العودة للأجبية</Link>
      </div>
    );
  }

  const allPrayers = [...commonOpeningPrayers, ...hour.prayers];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1 flex-wrap">
        <Link href="/orthodox" className="hover:underline">أرثوذوكسيات</Link>
        <ChevronLeft className="w-3 h-3" />
        <Link href="/orthodox/agpeya" className="hover:underline">الأجبية</Link>
        <ChevronLeft className="w-3 h-3" />
        <span>{hour.name}</span>
      </nav>

      <div className={`rounded-xl p-5 mb-6 ${hour.colorBg} border ${hour.colorBorder}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{hour.icon}</span>
          <div>
            <h1 className="text-2xl font-display font-bold">{hour.name}</h1>
            <p className="text-sm text-muted-foreground">{hour.arabicTime}</p>
          </div>
        </div>
        <p className="text-sm">{hour.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span><strong>المزامير:</strong> {hour.psalms}</span>
          <span>•</span>
          <span><strong>الإنجيل:</strong> {hour.gospel}</span>
          <span>•</span>
          <span><strong>التذكار:</strong> {hour.memory}</span>
        </div>
      </div>

      <div className="space-y-4">
        {allPrayers.map((prayer, i) => (
          <motion.div
            key={prayer.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  {prayer.title}
                </h2>
                {prayer.role && (
                  <Badge variant="outline" className="text-xs shrink-0">{prayer.role}</Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-arabic">{prayer.text}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex gap-3 justify-between text-sm">
        <Link href="/orthodox/agpeya" className="text-primary hover:underline">← جميع الساعات</Link>
        {agpeyaHoursFull[(agpeyaHoursFull.findIndex(h => h.id === hourId) + 1) % agpeyaHoursFull.length] && (
          <Link
            href={`/orthodox/agpeya/${agpeyaHoursFull[(agpeyaHoursFull.findIndex(h => h.id === hourId) + 1) % agpeyaHoursFull.length].id}`}
            className="text-primary hover:underline"
          >
            الساعة التالية →
          </Link>
        )}
      </div>
    </div>
  );
}
