import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
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
  COPTIC_ARABIC_MAP,
  type LiturgyType,
  type LiturgySession,
  type LiturgySlide,
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
  Copy,
  Check,
  Search,
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
  const params = useParams<{ slot?: string }>();
  const [, navigate] = useLocation();
  const [session, setSession] = useState<LiturgySession>(defaultSession as LiturgySession);
  const [slot, setSlot] = useState<string | null>(params?.slot ?? null);
  const [syncing, setSyncing] = useState(false);
  const [showDeaconPanel, setShowDeaconPanel] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  // copticMode مستقل عن session لتجنب stale closure عند pushSession
  const [copticMode, setCopticMode] = useState<'script' | 'arabic'>('script');
  const copticModeRef = useRef<'script' | 'arabic'>('script');

  const displayPath = slot ? `/liturgy-display/${slot}` : '/liturgy-display';

  function copyDisplayLink() {
    navigator.clipboard.writeText(window.location.origin + displayPath).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const currentSlides = getSplitSlidesForSection(session.liturgyType, session.sectionKey);
  const currentSlide = currentSlides[session.slideIndex];
  // section key هو المعرّف الأصلي قبل التقسيم (basil-opening لا basil-opening-p4)
  const currentSectionKey = session.sectionKey;
  const currentCopticArabic = COPTIC_ARABIC_MAP[currentSectionKey] ?? null;

  const pushSession = useCallback(async (patch: Partial<LiturgySession>) => {
    // دائماً نستخدم copticModeRef لضمان القيمة الأحدث وتجنب stale closure
    const next = { ...session, copticMode: copticModeRef.current, ...patch };
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

  // جلب الحالة عند الفتح — إن لم يكن في الـ URL slot، يُعاد توجيه تلقائياً
  useEffect(() => {
    fetch('/api/liturgy-session')
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text().catch(() => '')}`);
        return r.json();
      })
      .then(data => {
        if (!params?.slot && data.slot) {
          navigate(`/liturgy-control/${data.slot}`, { replace: true });
        }
        setSlot(data.slot ?? null);
        const slides = getSplitSlidesForSection(data.liturgyType, data.sectionKey);
        const safeIdx = Math.min(
          Math.max(0, data.slideIndex),
          Math.max(0, slides.length - 1),
        );
        const initialMode: 'script' | 'arabic' = data.copticMode === 'arabic' ? 'arabic' : 'script';
        copticModeRef.current = initialMode;
        setCopticMode(initialMode);
        setSession({ ...data, slideIndex: safeIdx, copticMode: initialMode });
      })
      .catch(err => console.error('[LiturgyControl] failed to load session:', err));
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

  // ── بحث ──────────────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  interface SearchHit {
    sectionKey: string;
    sectionLabel: string;
    sectionIcon: string;
    slideIndex: number;
    title: string;
    role: LiturgySlide['role'];
    excerpt: string;
  }

  function buildSearchResults(q: string): SearchHit[] {
    if (q.trim().length < 2) return [];
    const lower = q.toLowerCase();
    const sections = getSectionsForLiturgy(session.liturgyType);
    const hits: SearchHit[] = [];
    for (const sec of sections) {
      const slides = getSplitSlidesForSection(session.liturgyType, sec.sectionKey);
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const haystack = (s.text + ' ' + (s.copticText ?? '') + ' ' + s.title).toLowerCase();
        if (!haystack.includes(lower)) continue;
        // مقتطف من موضع الكلمة
        const pos = s.text.toLowerCase().indexOf(lower);
        const start = Math.max(0, pos - 30);
        const raw = s.text.slice(start, start + 100).replace(/\n/g, ' ');
        const excerpt = (start > 0 ? '...' : '') + raw + (raw.length >= 100 ? '...' : '');
        hits.push({
          sectionKey: sec.sectionKey,
          sectionLabel: sec.label,
          sectionIcon: sec.icon,
          slideIndex: i,
          title: s.title,
          role: s.role,
          excerpt,
        });
        if (hits.length >= 30) return hits;
      }
    }
    return hits;
  }

  const searchResults = buildSearchResults(searchQuery);

  function jumpToHit(hit: SearchHit) {
    pushSession({ sectionKey: hit.sectionKey, slideIndex: hit.slideIndex, deaconOverride: null });
    setShowSearch(false);
    setSearchQuery('');
  }

  function highlightQuery(text: string, q: string): React.ReactNode {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-400 text-black rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white p-4">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            لوحة التحكم — القداس الإلهي
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            شاشة العرض:{' '}
            <span className="text-amber-300 font-mono">{displayPath}</span>
            {slot && (
              <span className="mr-2 text-gray-500">— {slot}</span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* الصف الأول: فتح شاشة العرض + نسخ الرابط */}
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
              onClick={copyDisplayLink}
              title="نسخ رابط شاشة العرض"
            >
              {copied ? <Check className="w-3.5 h-3.5 ml-1 text-green-400" /> : <Copy className="w-3.5 h-3.5 ml-1" />}
              {copied ? 'تم النسخ' : 'نسخ الرابط'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300"
              onClick={() => window.open(displayPath, '_blank')}
            >
              <Monitor className="w-3.5 h-3.5 ml-1" />
              فتح شاشة العرض
            </Button>
          </div>
          {/* الصف الثاني: بحث */}
          <div className="flex items-center">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-amber-600/60 text-amber-300 hover:bg-amber-900/30 w-full sm:w-auto"
              onClick={() => setShowSearch(true)}
              title="بحث في نص القداس"
            >
              <Search className="w-3.5 h-3.5 ml-1" />
              بحث في نص القداس
            </Button>
          </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs font-bold ${getRoleColor(currentSlide.role)}`}>
                      {getRoleLabel(currentSlide.role)}
                    </div>
                    {(currentSlide.copticText || currentCopticArabic) && (
                      <button
                        onClick={() => {
                          const next: 'script' | 'arabic' = copticModeRef.current === 'script' ? 'arabic' : 'script';
                          copticModeRef.current = next;
                          setCopticMode(next);
                          pushSession({ copticMode: next });
                        }}
                        className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                      >
                        {copticMode === 'script' ? 'قبطي بعربي ←' : '← ϯⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ'}
                      </button>
                    )}
                  </div>
                  <h3 className="text-sm text-gray-400 mb-2">{currentSlide.title}</h3>
                  <p className="text-white text-sm font-serif whitespace-pre-line leading-relaxed line-clamp-6">
                    {currentSlide.text}
                  </p>
                  {copticMode === 'script' && currentSlide.copticText && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <span className="text-xs font-bold text-blue-400 block mb-1">ϯⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ</span>
                      <p dir="ltr" className="text-blue-300 text-xs font-serif whitespace-pre-line leading-relaxed line-clamp-4">
                        {currentSlide.copticText}
                      </p>
                    </div>
                  )}
                  {copticMode === 'arabic' && currentCopticArabic && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <span className="text-xs font-bold text-amber-400 block mb-1">قبطي بحروف عربية</span>
                      <p dir="rtl" className="text-amber-300 text-xs whitespace-pre-line leading-relaxed line-clamp-4">
                        {currentCopticArabic}
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

      {/* ── مودال البحث ────────────────────────────────────────────────────── */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowSearch(false); setSearchQuery(''); } }}
        >
          <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden" dir="rtl">
            {/* شريط البحث */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-700">
              <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="اكتب ما تسمعه من النص... (عربي أو قبطي)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none font-serif"
                dir="rtl"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="text-gray-500 hover:text-white mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* تعليمات */}
            {!searchQuery && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p>اكتب أي كلمة تسمعها من نص القداس</p>
                <p className="text-xs mt-1 text-gray-600">سيبحث في كل أقسام {getLiturgyLabel(session.liturgyType)}</p>
              </div>
            )}

            {/* لا نتائج */}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                <p>لا توجد نتائج لـ "<span className="text-white">{searchQuery}</span>"</p>
                <p className="text-xs mt-1 text-gray-600">جرّب كلمة أخرى من النص</p>
              </div>
            )}

            {/* النتائج */}
            {searchResults.length > 0 && (
              <div className="overflow-y-auto max-h-[60vh]">
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-800">
                  {searchResults.length} نتيجة في {getLiturgyLabel(session.liturgyType)}
                </div>
                {searchResults.map((hit, idx) => (
                  <button
                    key={`${hit.sectionKey}-${hit.slideIndex}-${idx}`}
                    onClick={() => jumpToHit(hit)}
                    className="w-full text-right px-4 py-3 hover:bg-amber-900/20 border-b border-gray-800/50 transition-all group"
                  >
                    {/* رأس النتيجة */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{hit.sectionIcon}</span>
                      <span className="text-xs text-amber-400 font-bold">{hit.sectionLabel}</span>
                      <span className="text-gray-600 text-xs">—</span>
                      <span className="text-xs text-gray-400">{hit.title}</span>
                      <span className={`text-xs font-bold mr-auto ${getRoleColor(hit.role)}`}>
                        {getRoleLabel(hit.role)}
                      </span>
                    </div>
                    {/* مقتطف النص مع تمييز */}
                    <p className="text-gray-300 text-sm font-serif leading-relaxed text-right group-hover:text-white transition-colors">
                      {highlightQuery(hit.excerpt, searchQuery)}
                    </p>
                    {/* زر الانتقال */}
                    <div className="mt-1 text-xs text-amber-600 group-hover:text-amber-400 transition-colors">
                      اضغط للانتقال إلى هذا الموضع ←
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
