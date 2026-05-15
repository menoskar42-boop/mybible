import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSectionsForLiturgy,
  getSplitSlidesForSection,
  findEquivalentSection,
  getLiturgyLabel,
  getRoleLabel,
  getRoleColor,
  deaconResponses,
  defaultSession,
  type LiturgyType,
  type LiturgySession,
  type DeaconResponse,
} from '@/lib/liturgy-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  RefreshCw,
  X,
  BookOpen,
} from 'lucide-react';

const LITURGY_TYPES: LiturgyType[] = ['basil', 'gregory', 'cyril'];
const LITURGY_COLORS: Record<LiturgyType, string> = {
  basil: 'bg-amber-600 hover:bg-amber-700',
  gregory: 'bg-purple-600 hover:bg-purple-700',
  cyril: 'bg-blue-600 hover:bg-blue-700',
};
const LITURGY_ACTIVE: Record<LiturgyType, string> = {
  basil: 'ring-2 ring-amber-400',
  gregory: 'ring-2 ring-purple-400',
  cyril: 'ring-2 ring-blue-400',
};

export default function LiturgyControl() {
  const [session, setSession] = useState<LiturgySession>(defaultSession as LiturgySession);
  const [syncing, setSyncing] = useState(false);
  const [showDeaconPanel, setShowDeaconPanel] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const currentSlides = getSplitSlidesForSection(session.liturgyType, session.sectionKey);
  const currentSlide = currentSlides[session.slideIndex];

  const pushSession = useCallback(async (patch: Partial<LiturgySession>) => {
    const next = { ...session, ...patch };
    setSession(next);
    setSyncing(true);
    try {
      await fetch('/api/liturgy-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      setLastSync(new Date());
    } catch { /* silent */ }
    finally { setSyncing(false); }
  }, [session]);

  // جلب الحالة عند الفتح
  useEffect(() => {
    fetch('/api/liturgy-session')
      .then(r => r.json())
      .then(data => {
        const slides = getSplitSlidesForSection(data.liturgyType, data.sectionKey);
        const safeIdx = Math.min(
          Math.max(0, data.slideIndex),
          Math.max(0, slides.length - 1),
        );
        setSession({ ...data, slideIndex: safeIdx });
      })
      .catch(() => {});
  }, []);

  function switchLiturgy(type: LiturgyType) {
    const equivalentSection = findEquivalentSection(session.liturgyType, session.sectionKey, type);
    const fallback = getSectionsForLiturgy(type)[0]?.sectionKey ?? 'basil-opening';
    pushSession({ liturgyType: type, sectionKey: equivalentSection || fallback, slideIndex: 0, deaconOverride: null });
  }

  function switchSection(key: string) {
    pushSession({ sectionKey: key, slideIndex: 0, deaconOverride: null });
  }

  function goNext() {
    if (session.deaconOverride) {
      pushSession({ deaconOverride: null });
      return;
    }
    if (session.slideIndex < currentSlides.length - 1) {
      pushSession({ slideIndex: session.slideIndex + 1, deaconOverride: null });
    }
  }

  function goPrev() {
    if (session.deaconOverride) {
      pushSession({ deaconOverride: null });
      return;
    }
    if (session.slideIndex > 0) {
      pushSession({ slideIndex: session.slideIndex - 1, deaconOverride: null });
    }
  }

  function injectDeacon(resp: DeaconResponse) {
    pushSession({ deaconOverride: resp });
    setShowDeaconPanel(false);
  }

  function clearDeacon() {
    pushSession({ deaconOverride: null });
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white p-4">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            لوحة التحكم — القداس الإلهي
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            افتح <span className="text-amber-300 font-mono">/liturgy-display</span> على شاشة العرض
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncing && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
          {lastSync && !syncing && (
            <span className="text-xs text-gray-500">
              {lastSync.toLocaleTimeString('ar-EG')}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-600 text-gray-300"
            onClick={() => window.open('/liturgy-display', '_blank')}
          >
            <Monitor className="w-3.5 h-3.5 ml-1" />
            فتح شاشة العرض
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── العمود الأيمن: التحكم الرئيسي ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* اختيار القداس */}
          <Card className="bg-gray-900 border-gray-700 p-4">
            <h2 className="text-sm font-bold text-gray-300 mb-3">القداس</h2>
            <div className="flex gap-2 flex-wrap">
              {LITURGY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => switchLiturgy(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-all ${LITURGY_COLORS[type]} ${session.liturgyType === type ? LITURGY_ACTIVE[type] : 'opacity-60'}`}
                  data-testid={`liturgy-switch-${type}`}
                >
                  {getLiturgyLabel(type)}
                </button>
              ))}
            </div>
          </Card>

          {/* معاينة الشريحة الحالية */}
          <Card className="bg-gray-900 border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-300">الشريحة الحالية</h2>
              <span className="text-xs text-gray-500">
                {session.slideIndex + 1} / {currentSlides.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {session.deaconOverride ? (
                <motion.div
                  key="deacon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-blue-900/40 border border-blue-700 rounded-xl p-4 mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-300 font-bold">مرد الشماس — معروض الآن</span>
                    <button onClick={clearDeacon} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-white text-lg font-serif whitespace-pre-line leading-relaxed">
                    {session.deaconOverride.text}
                  </p>
                </motion.div>
              ) : currentSlide ? (
                <motion.div
                  key={`${session.sectionKey}-${session.slideIndex}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-gray-800 rounded-xl p-4 mb-4"
                >
                  <div className={`text-xs font-bold mb-2 ${getRoleColor(currentSlide.role)}`}>
                    {getRoleLabel(currentSlide.role)}
                  </div>
                  <h3 className="text-sm text-gray-400 mb-2">{currentSlide.title}</h3>
                  <p className="text-white text-sm font-serif whitespace-pre-line leading-relaxed line-clamp-6">
                    {currentSlide.text}
                  </p>
                  {currentSlide.copticText && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <span className="text-xs font-bold text-blue-400 block mb-1">ϯⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ</span>
                      <p dir="ltr" className="text-blue-300 text-xs font-serif whitespace-pre-line leading-relaxed line-clamp-4">
                        {currentSlide.copticText}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-gray-500 text-sm text-center py-6">لا توجد شرائح</div>
              )}
            </AnimatePresence>

            {/* أزرار التنقل */}
            <div className="flex items-center gap-3 justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={goPrev}
                disabled={!session.deaconOverride && session.slideIndex === 0}
                className="border-gray-600 text-white hover:bg-gray-700 flex-1"
                data-testid="ctrl-prev"
              >
                <ChevronRight className="w-5 h-5 ml-1" />
                السابق
              </Button>
              <Button
                size="lg"
                onClick={goNext}
                disabled={!session.deaconOverride && session.slideIndex >= currentSlides.length - 1}
                className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                data-testid="ctrl-next"
              >
                التالي
                <ChevronLeft className="w-5 h-5 mr-1" />
              </Button>
            </div>
          </Card>

          {/* قائمة الشرائح */}
          <Card className="bg-gray-900 border-gray-700 p-4">
            <h2 className="text-sm font-bold text-gray-300 mb-3">شرائح القسم</h2>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {currentSlides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => pushSession({ slideIndex: i, deaconOverride: null })}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                    i === session.slideIndex && !session.deaconOverride
                      ? 'bg-amber-600/20 border border-amber-600/40 text-amber-200'
                      : 'hover:bg-gray-800 text-gray-400'
                  }`}
                  data-testid={`slide-btn-${i}`}
                >
                  <span className={`w-16 flex-shrink-0 text-xs font-bold ${getRoleColor(slide.role)}`}>
                    {getRoleLabel(slide.role)}
                  </span>
                  <span className="truncate">{slide.title}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── العمود الأيسر: الأقسام + مردات الشماس ── */}
        <div className="space-y-4">
          {/* الأقسام */}
          <Card className="bg-gray-900 border-gray-700 p-4">
            <h2 className="text-sm font-bold text-gray-300 mb-3">الأقسام</h2>
            <div className="space-y-1">
              {getSectionsForLiturgy(session.liturgyType).map(sec => {
                const slides = getSplitSlidesForSection(session.liturgyType, sec.sectionKey);
                return (
                  <button
                    key={sec.sectionKey}
                    onClick={() => switchSection(sec.sectionKey)}
                    disabled={slides.length === 0}
                    className={`w-full text-right px-3 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2 ${
                      session.sectionKey === sec.sectionKey
                        ? 'bg-amber-600/30 border border-amber-500/50 text-amber-200'
                        : slides.length === 0
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                    data-testid={`section-btn-${sec.sectionKey}`}
                  >
                    <span>{sec.icon}</span>
                    <span className="flex-1">{sec.label}</span>
                    <span className="text-gray-600">{slides.length}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* مردات الشماس */}
          <Card className="bg-gray-900 border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-300">مردات الشماس</h2>
              <button
                onClick={() => setShowDeaconPanel(!showDeaconPanel)}
                className="text-xs text-blue-400 hover:text-blue-300"
                data-testid="toggle-deacon-panel"
              >
                {showDeaconPanel ? 'إغلاق' : 'إظهار'}
              </button>
            </div>

            {session.deaconOverride && (
              <div className="mb-2 flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-300 flex-1 truncate">
                  معروض: {session.deaconOverride.text.split('\n')[0]}
                </span>
                <button onClick={clearDeacon} data-testid="clear-deacon">
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                </button>
              </div>
            )}

            <AnimatePresence>
              {showDeaconPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 mt-2">
                    {deaconResponses.map(resp => (
                      <button
                        key={resp.id}
                        onClick={() => injectDeacon(resp)}
                        className="w-full text-right px-3 py-2 rounded-lg text-xs hover:bg-blue-900/30 hover:text-blue-200 text-gray-400 transition-all border border-transparent hover:border-blue-800/50 font-serif"
                        data-testid={`deacon-btn-${resp.id}`}
                      >
                        {resp.text.split('\n')[0]}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showDeaconPanel && (
              <button
                onClick={() => setShowDeaconPanel(true)}
                className="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-xs text-gray-500 hover:border-blue-700 hover:text-blue-400 transition-all"
                data-testid="open-deacon-panel"
              >
                + إدخال مرد شماس
              </button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
