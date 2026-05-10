import { motion } from 'framer-motion';
import { Share2, Bookmark, RefreshCw, Download, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getSavedVerses, saveVerse, isVerseSaved } from '@/lib/saved-verses';
import { downloadVerseImage, shareVerseImage } from '@/lib/verse-image';

export function DailyVerse() {
  const [saved, setSaved] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const { data: dailyVerse, isLoading } = useQuery({
    queryKey: ['dailyVerse'],
    queryFn: api.dailyVerse.get,
  });

  useEffect(() => {
    if (dailyVerse) {
      const ref = `${dailyVerse.book.name} ${dailyVerse.verse.chapter}:${dailyVerse.verse.verse}`;
      setSaved(isVerseSaved(ref));
    }
  }, [dailyVerse]);

  const handleShare = async () => {
    if (!dailyVerse) return;

    const verseText = dailyVerse.verse.text;
    const verseReference = `${dailyVerse.book.name} ${dailyVerse.verse.chapter}:${dailyVerse.verse.verse}`;
    const shareText = verseText + ' - ' + verseReference;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'آية اليوم من الكتاب المقدس',
          text: shareText,
          url: 'https://mybible.oscardevs.com',
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          await copyToClipboard(shareText);
        }
      }
    } else {
      await copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('تم نسخ الآية، يمكنك لصقها في واتساب أو فيسبوك');
    } catch {
      toast.error('لم يتم النسخ، حاول مرة أخرى');
    }
  };

  const getVerseInfo = () => {
    if (!dailyVerse) return { text: '', ref: '' };
    return {
      text: dailyVerse.verse.text,
      ref: `${dailyVerse.book.name} ${dailyVerse.verse.chapter}:${dailyVerse.verse.verse}`,
    };
  };

  const handleDownloadImage = async () => {
    if (!dailyVerse) return;
    setGeneratingImage(true);
    try {
      const { text, ref } = getVerseInfo();
      await downloadVerseImage(text, ref);
      toast.success('تم تحميل صورة الآية');
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الصورة');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleShareImage = async () => {
    if (!dailyVerse) return;
    setGeneratingImage(true);
    try {
      const { text, ref } = getVerseInfo();
      const shared = await shareVerseImage(text, ref);
      if (!shared) {
        toast.success('تم تحميل صورة الآية');
      }
    } catch {
      toast.error('حدث خطأ أثناء مشاركة الصورة');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSave = () => {
    if (!dailyVerse) return;

    const verseText = dailyVerse.verse.text;
    const verseReference = `${dailyVerse.book.name} ${dailyVerse.verse.chapter}:${dailyVerse.verse.verse}`;

    const wasAdded = saveVerse(verseText, verseReference);
    setSaved(true);

    if (wasAdded) {
      toast.success('تم حفظ الآية في المفضلة');
    } else {
      toast.info('الآية محفوظة بالفعل');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 sm:p-8 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
      </Card>
    );
  }

  if (!dailyVerse) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-center text-muted-foreground">لا توجد آية لليوم</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 shadow-lg">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">آية اليوم</h2>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground" data-testid="button-refresh-verse">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <blockquote className="relative mb-6">
            <span className="absolute -top-4 -right-2 text-6xl text-primary/10 font-display">"</span>
            <p className="font-display text-2xl sm:text-3xl leading-relaxed text-foreground pr-4 sm:pr-6" data-testid="text-daily-verse">
              {dailyVerse.verse.text}
            </p>
            <span className="absolute -bottom-8 -left-2 text-6xl text-primary/10 font-display rotate-180">"</span>
          </blockquote>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <p className="text-sm font-medium text-primary" data-testid="text-verse-reference">
              {dailyVerse.book.name} {dailyVerse.verse.chapter}:{dailyVerse.verse.verse}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={cn(saved && 'text-primary')}
                data-testid="button-save-verse"
              >
                <Bookmark className={cn('w-4 h-4 ml-1', saved && 'fill-current')} />
                {saved ? 'محفوظة' : 'حفظ'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare} data-testid="button-share-verse">
                <Share2 className="w-4 h-4 ml-1" />
                مشاركة
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              disabled={generatingImage}
              data-testid="button-download-verse-image"
            >
              <Download className="w-4 h-4 ml-1" />
              تحميل صورة الآية
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareImage}
              disabled={generatingImage}
              data-testid="button-share-verse-image"
            >
              <ImageIcon className="w-4 h-4 ml-1" />
              مشاركة كصورة
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
