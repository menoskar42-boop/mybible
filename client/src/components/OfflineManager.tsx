import { WifiOff, Download, CheckCircle, XCircle, X, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineManager() {
  const { status, progress, startSync, cancelSync } = useOfflineSync();

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const remaining = progress.total > 0
    ? Math.ceil(((progress.total - progress.done) * 80) / 1000 / 60)
    : 4;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <WifiOff className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <p className="font-semibold text-sm text-foreground">تصفح بدون إنترنت</p>
          <p className="text-xs text-muted-foreground">
            يُنزّل الكتاب المقدس كاملاً (٦٦ سفراً + التفاسير) ويحفظه على جهازك
          </p>
        </div>
      </div>

      {/* الأسفار القانونية الثانية مُضمَّنة دائماً في التطبيق */}
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
        <PackageCheck className="h-4 w-4 text-green-500 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">الأسفار القانونية الثانية</span> (طوبيا، يهوديت، المكابيين، حكمة سليمان، يشوع بن سيراخ، باروخ…) مُضمَّنة في التطبيق ومتاحة أوفلاين تلقائياً بدون تنزيل إضافي.
        </p>
      </div>

      {status === 'idle' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            الحجم: ~20MB · الوقت المتوقع: 2-4 دقائق
          </p>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={startSync}>
            <Download className="h-4 w-4" />
            تنزيل
          </Button>
        </div>
      )}

      {status === 'syncing' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.currentBook && `جاري: ${progress.currentBook}`}</span>
            <span className="flex items-center gap-1">
              {pct}%
              <button onClick={cancelSync} className="mr-2 text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {progress.done.toLocaleString('ar-EG')} / {progress.total.toLocaleString('ar-EG')} ·
            {remaining > 1 ? ` ${remaining} دقائق متبقية` : ' أقل من دقيقة'}
          </p>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>تم التنزيل! الكتاب المقدس كاملاً (بما فيه الأسفار القانونية الثانية) متاح الآن بدون إنترنت</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>فشل التنزيل، تحقق من الاتصال وأعد المحاولة</span>
          </div>
          <Button size="sm" variant="outline" onClick={startSync}>إعادة</Button>
        </div>
      )}
    </div>
  );
}
