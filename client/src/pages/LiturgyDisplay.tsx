import { useEffect, useState } from 'react';
import {
  getSectionsForLiturgy,
  getSplitSlidesForSection,
  getRoleColor,
  getRoleLabel,
  getLiturgyLabel,
  type LiturgySession,
  type LiturgySlide,
  type DeaconResponse,
  defaultSession,
} from '@/lib/liturgy-map';

export default function LiturgyDisplay() {
  const [session, setSession] = useState<LiturgySession>(defaultSession as LiturgySession);
  const [currentSlide, setCurrentSlide] = useState<LiturgySlide | null>(null);
  const [deaconSlide, setDeaconSlide] = useState<DeaconResponse | null>(null);

  useEffect(() => {
    document.title = 'عرض القداس';
    document.body.style.background = '#000';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.background = '';
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/liturgy-session');
        if (!res.ok || cancelled) return;
        const data: LiturgySession = await res.json();
        setSession(data);
        if (data.deaconOverride) {
          setDeaconSlide(data.deaconOverride as DeaconResponse);
          setCurrentSlide(null);
        } else {
          setDeaconSlide(null);
          const slides = getSplitSlidesForSection(data.liturgyType, data.sectionKey);
          setCurrentSlide(slides[data.slideIndex] ?? null);
        }
      } catch {
        // silent — keep last state
      }
    }
    poll();
    const interval = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const section = getSectionsForLiturgy(session.liturgyType).find(s => s.sectionKey === session.sectionKey);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 bg-black flex flex-col items-center justify-center"
      style={{ fontFamily: 'serif' }}
    >
      {/* شريط المعلومات العلوي */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 opacity-40">
        <span className="text-white text-sm">
          {getLiturgyLabel(session.liturgyType)}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">{section?.icon} {section?.label}</span>
        </div>
        <span className="text-white text-sm">
          {session.slideIndex + 1}
        </span>
      </div>

      {/* شريحة الشماس */}
      {deaconSlide && (
        <div className="flex flex-col items-center gap-6 px-12 max-w-4xl text-center animate-pulse">
          <div className="text-blue-400 text-sm font-bold tracking-widest uppercase">
            مرد الشماس
          </div>
          <div
            className="text-white whitespace-pre-line"
            style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', lineHeight: 1.6 }}
          >
            {deaconSlide.text}
          </div>
        </div>
      )}

      {/* الشريحة الرئيسية */}
      {!deaconSlide && currentSlide && (
        currentSlide.copticText ? (
          /* شاشة مقسومة: عربي على اليمين — قبطي على اليسار */
          <div className="flex w-full h-full items-center" style={{ maxHeight: '80vh' }}>
            {/* الجانب العربي — يمين */}
            <div
              dir="rtl"
              className="flex-1 flex flex-col items-center justify-center gap-6 px-10 border-r border-white/10 h-full"
            >
              <div className={`text-xs font-bold tracking-widest uppercase ${getRoleColor(currentSlide.role)}`}>
                {getRoleLabel(currentSlide.role)}
              </div>
              <div
                className="text-white whitespace-pre-line text-center"
                style={{ fontSize: 'clamp(1.4rem, 3.5vw, 3rem)', lineHeight: 1.8 }}
              >
                {currentSlide.text}
              </div>
              <div className="text-white/30 text-sm">{currentSlide.title}</div>
            </div>
            {/* الجانب القبطي — يسار */}
            <div
              dir="ltr"
              className="flex-1 flex flex-col items-center justify-center gap-6 px-10 h-full"
            >
              <div className="text-blue-300/60 text-xs font-bold tracking-widest uppercase">Coptic</div>
              <div
                className="text-white/90 whitespace-pre-line text-center"
                style={{ fontSize: 'clamp(1.2rem, 3vw, 2.6rem)', lineHeight: 1.9, fontFamily: 'serif' }}
              >
                {currentSlide.copticText}
              </div>
            </div>
          </div>
        ) : (
          /* شاشة عادية بدون قبطي */
          <div className="flex flex-col items-center gap-8 px-12 max-w-5xl text-center">
            <div className={`text-xs font-bold tracking-widest uppercase ${getRoleColor(currentSlide.role)}`}>
              {getRoleLabel(currentSlide.role)}
            </div>
            <div
              className="text-white whitespace-pre-line"
              style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3.8rem)', lineHeight: 1.8 }}
            >
              {currentSlide.text}
            </div>
            <div className="text-white/30 text-sm">
              {currentSlide.title}
            </div>
          </div>
        )
      )}

      {/* حالة الانتظار */}
      {!deaconSlide && !currentSlide && (
        <div className="text-white/30 text-2xl">
          في انتظار بدء القداس...
        </div>
      )}

      {/* شريط سفلي */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {getSplitSlidesForSection(session.liturgyType, session.sectionKey).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === session.slideIndex ? 'bg-white w-8' : 'bg-white/20 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
