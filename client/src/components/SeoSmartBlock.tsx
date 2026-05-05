/**
 * SeoSmartBlock — Phase 2
 * Renders intent-aware related links + FAQ accordion.
 * Minimal UI, rich semantic DOM for crawlers.
 */
import { useEffect, useRef, useState } from 'react';

interface SeoLink { href: string; label: string; anchor: string }
interface SeoContext {
  intent: string;
  title: string;
  links: SeoLink[];
  faqSchema: object | null;
}

interface Props {
  query: string;
  verses?: Array<{ bookName: string; chapter: number; verse: number; text: string }>;
  className?: string;
}

export function SeoSmartBlock({ query, verses = [], className = '' }: Props) {
  const [ctx, setCtx] = useState<SeoContext | null>(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!query?.trim()) return;
    let cancelled = false;
    fetch(`/api/seo/context?q=${encodeURIComponent(query)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verses: verses.slice(0, 5) }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data) setCtx(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [query]);

  // Inject FAQ JSON-LD into <head>
  useEffect(() => {
    if (!ctx?.faqSchema || injectedRef.current) return;
    injectedRef.current = true;
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-seo-faq', 'true');
    s.textContent = JSON.stringify(ctx.faqSchema);
    document.head.appendChild(s);
    return () => {
      const el = document.querySelector('script[data-seo-faq]');
      if (el) el.remove();
      injectedRef.current = false;
    };
  }, [ctx?.faqSchema]);

  if (!ctx || ctx.links.length === 0) return null;

  return (
    <aside className={`seo-smart-block mt-6 ${className}`} aria-label="مواضيع ذات صلة">
      {/* Visible related links */}
      <div className="flex flex-wrap gap-2 justify-end">
        <span className="text-xs text-muted-foreground ml-2 self-center">مواضيع ذات صلة:</span>
        {ctx.links.map(link => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors text-foreground/70 hover:text-foreground"
            data-testid={`seo-link-${link.label}`}
          >
            {link.anchor}
          </a>
        ))}
      </div>

      {/* Hidden semantic text for crawlers — not intrusive visually */}
      <div
        className="sr-only"
        aria-hidden="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        <h2>مواضيع ذات صلة بـ {query}</h2>
        <nav>
          {ctx.links.map(link => (
            <a key={link.href} href={link.href}>{link.anchor}</a>
          ))}
        </nav>
        {verses.length > 0 && (
          <section>
            <h3>آيات الكتاب المقدس عن {query}</h3>
            {verses.slice(0, 5).map((v, i) => (
              <p key={i}>
                <strong>{v.bookName} {v.chapter}:{v.verse}</strong> — {v.text}
              </p>
            ))}
          </section>
        )}
      </div>
    </aside>
  );
}
