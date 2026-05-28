import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Sparkles, BookOpen, Plus, X, Copy, Printer, Loader2, ScrollText, GraduationCap, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchVerseTafsir } from '@/lib/tafsir-csv-service';
import { TafsirText } from '@/components/TafsirText';
import { SEOHead } from '@/components/SEOHead';
import { usePageTracker } from '@/hooks/usePageTracker';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

type VerseResult = {
  id: number;
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  bookName?: string;
  relevanceScore?: number;
  matchType?: string;
};

type DraftVerse = { id: number; bookName: string; chapter: number; verse: number; text: string };
type OutlineVerse = { ref: string; book: string; chapter: number; verse: number; text: string };

type SermonOutline = { intro: string; points: string[]; application: string; conclusion: string };
type LessonOutline = { intro: string; points: string[]; activity: string; prayer: string };
type Outline = (SermonOutline | LessonOutline) & { _type: 'sermon' | 'lesson' };

const DRAFT_KEY = 'service-draft-verses';
const OUTLINE_KEY = 'service-draft-outline';

const SUGGESTED_TOPICS = [
  'الغفران', 'التوبة', 'المحبة', 'الصلاة', 'الصوم', 'الرجاء',
  'الصبر', 'التواضع', 'الخوف من الله', 'التربية المسيحية',
];

export default function Service() {
  const [location] = useLocation();
  usePageTracker(location);

  const [tab,           setTab]           = useState<'clergy' | 'sunday'>('clergy');
  const [query,         setQuery]         = useState('');
  const [topic,         setTopic]         = useState('');
  const [audience,      setAudience]      = useState('');
  const [outlineVerses, setOutlineVerses] = useState<OutlineVerse[]>([]);
  const [outlineVersesDone, setOutlineVersesDone] = useState(false);
  const [outlineVersesLoading, setOutlineVersesLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchMore, setSearchMore] = useState<OutlineVerse[]>([]);
  const [searchMoreLoading, setSearchMoreLoading] = useState(false);
  const [outline,       setOutline]       = useState<Outline | null>(() => {
    try { const raw = localStorage.getItem(OUTLINE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [draft,         setDraft]         = useState<DraftVerse[]>(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  // تفسير الآية (نفس pattern Bible.tsx)
  const [tafsirOpen,    setTafsirOpen]    = useState(false);
  const [tafsirRef,     setTafsirRef]     = useState('');
  const [tafsirText,    setTafsirText]    = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }, [draft]);
  useEffect(() => {
    if (outline) localStorage.setItem(OUTLINE_KEY, JSON.stringify(outline));
    else localStorage.removeItem(OUTLINE_KEY);
  }, [outline]);

  // ── بحث الآيات بالذكاء الاصطناعي (يعيد استخدام endpoint موجود) ────────────
  const searchMutation = useMutation({
    mutationFn: (q: string) => api.verses.aiEnhancedSearch(q),
  });

  const allResults: VerseResult[] = [
    ...(searchMutation.data?.exactResults ?? []),
    ...(searchMutation.data?.semanticResults ?? []),
  ];

  function runSearch(q?: string) {
    const qq = (q ?? query).trim();
    if (!qq) return;
    setQuery(qq);
    setSearchDone(false);
    setSearchMore([]);
    searchMutation.mutate(qq);
  }

  // ── توليد هيكل العظة/الدرس ──────────────────────────────────────────────
  const outlineMutation = useMutation<{ outline: SermonOutline | LessonOutline; type: 'sermon' | 'lesson'; outlineVerses?: OutlineVerse[] }, Error, void>({
    mutationFn: async () => {
      const t = topic.trim();
      if (!t) throw new Error('اكتب موضوع العظة/الدرس أولاً');
      const type = tab === 'clergy' ? 'sermon' : 'lesson';
      const res = await fetch('/api/service/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t, audience: audience.trim() || undefined, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'فشل توليد الهيكل' }));
        throw new Error(err.message || 'فشل توليد الهيكل');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setOutline({ ...data.outline, _type: data.type } as Outline);
      setOutlineVerses(data.outlineVerses ?? []);
      setOutlineVersesDone(false);
    },
    onError: (e) => toast.error(e.message),
  });

  async function loadMoreVerses(scope: 'outline' | 'search') {
    const topicText = scope === 'outline' ? topic.trim() : query.trim();
    if (!topicText) return;
    const existing = scope === 'outline'
      ? outlineVerses.map(v => v.ref)
      : [...(searchMutation.data?.semanticResults ?? []).map((v: any) => `${v.bookName} ${v.chapter}:${v.verse}`), ...searchMore.map(v => v.ref)];
    const setLoading = scope === 'outline' ? setOutlineVersesLoading : setSearchMoreLoading;
    const setDone    = scope === 'outline' ? setOutlineVersesDone    : setSearchDone;
    setLoading(true);
    try {
      const res = await fetch('/api/verses/more-on-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicText, excludeRefs: existing }),
      });
      if (!res.ok) throw new Error('تعذّر جلب المزيد');
      const data = await res.json() as { verses: OutlineVerse[]; done: boolean };
      if (scope === 'outline') {
        setOutlineVerses(prev => [...prev, ...data.verses]);
      } else {
        setSearchMore(prev => [...prev, ...data.verses]);
      }
      if (data.done || data.verses.length === 0) setDone(true);
    } catch (e: any) {
      toast.error(e.message || 'خطأ');
    } finally {
      setLoading(false);
    }
  }

  // ── تفسير الآية ──────────────────────────────────────────────────────────
  function openTafsir(v: VerseResult) {
    const bookName = v.bookName || '';
    if (!bookName) { toast.error('اسم السفر غير متوفر'); return; }
    setTafsirRef(`${bookName} ${v.chapter}:${v.verse}`);
    setTafsirText(null);
    setTafsirLoading(true);
    setTafsirOpen(true);
    fetchVerseTafsir(bookName, v.chapter, v.verse)
      .then(text => { setTafsirText(text); setTafsirLoading(false); })
      .catch(() => setTafsirLoading(false));
  }

  // ── المسودة ──────────────────────────────────────────────────────────────
  function addToDraft(v: VerseResult) {
    if (!v.bookName) return;
    if (draft.some(d => d.id === v.id)) { toast.info('هذه الآية موجودة في المسودة'); return; }
    setDraft(prev => [...prev, { id: v.id, bookName: v.bookName!, chapter: v.chapter, verse: v.verse, text: v.text }]);
    toast.success('أُضيفت للمسودة');
  }
  function removeFromDraft(id: number) { setDraft(prev => prev.filter(d => d.id !== id)); }
  function clearDraft() {
    if (!confirm('مسح المسودة كاملة؟')) return;
    setDraft([]); setOutline(null);
  }

  function buildDraftText(): string {
    const lines: string[] = [];
    lines.push(`📋 مسودة ${tab === 'clergy' ? 'العظة' : 'الدرس'}`);
    if (topic) lines.push(`الموضوع: ${topic}`);
    if (audience) lines.push(`الجمهور: ${audience}`);
    lines.push('');
    if (outline) {
      lines.push('── الهيكل المقترح ──');
      lines.push(`المقدمة: ${outline.intro}`);
      lines.push('');
      lines.push('النقاط الرئيسية:');
      outline.points.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));
      lines.push('');
      if (outline._type === 'sermon') {
        lines.push(`التطبيق العملي: ${(outline as SermonOutline).application}`);
        lines.push(`الخاتمة: ${(outline as SermonOutline).conclusion}`);
      } else {
        lines.push(`النشاط: ${(outline as LessonOutline).activity}`);
        lines.push(`الصلاة الختامية: ${(outline as LessonOutline).prayer}`);
      }
      lines.push('');
    }
    if (draft.length > 0) {
      lines.push('── الآيات المختارة ──');
      draft.forEach((v, i) => {
        lines.push(`${i + 1}. (${v.bookName} ${v.chapter}:${v.verse}) ${v.text}`);
      });
    }
    return lines.join('\n');
  }

  async function copyDraft() {
    const text = buildDraftText();
    try {
      await navigator.clipboard.writeText(text);
      toast.success('نُسخت المسودة');
    } catch {
      toast.error('تعذّر النسخ');
    }
  }

  function printDraft() {
    const title = `مسودة ${tab === 'clergy' ? 'العظة' : 'الدرس'}`;
    const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const parts: string[] = [];
    parts.push(`<h1>${esc(title)}</h1>`);
    if (topic) parts.push(`<p><strong>الموضوع:</strong> ${esc(topic)}</p>`);
    if (audience) parts.push(`<p><strong>الجمهور:</strong> ${esc(audience)}</p>`);
    if (outline) {
      parts.push(`<h2>الهيكل المقترح</h2>`);
      parts.push(`<p><strong>المقدمة:</strong> ${esc(outline.intro)}</p>`);
      parts.push(`<h3>النقاط الرئيسية</h3><ol>${outline.points.map(p => `<li>${esc(p)}</li>`).join('')}</ol>`);
      if (outline._type === 'sermon') {
        parts.push(`<p><strong>التطبيق العملي:</strong> ${esc((outline as SermonOutline).application)}</p>`);
        parts.push(`<p><strong>الخاتمة:</strong> ${esc((outline as SermonOutline).conclusion)}</p>`);
      } else {
        parts.push(`<p><strong>النشاط:</strong> ${esc((outline as LessonOutline).activity)}</p>`);
        parts.push(`<p><strong>الصلاة الختامية:</strong> ${esc((outline as LessonOutline).prayer)}</p>`);
      }
    }
    if (draft.length > 0) {
      parts.push(`<h2>الآيات المختارة</h2><ol>${draft.map(v => `<li><span class="ref">(${esc(v.bookName)} ${v.chapter}:${v.verse})</span> ${esc(v.text)}</li>`).join('')}</ol>`);
    }
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${esc(title)}</title>
      <style>
        body { font-family: 'Tajawal', 'Amiri', serif; padding: 24px; line-height: 1.9; color: #222; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 22px; border-bottom: 2px solid #8B5E3C; padding-bottom: 8px; }
        h2 { font-size: 18px; color: #8B5E3C; margin-top: 24px; }
        h3 { font-size: 16px; margin-top: 16px; }
        ol, ul { padding-right: 24px; }
        li { margin-bottom: 8px; }
        .ref { color: #8B5E3C; font-weight: 600; margin-left: 6px; }
        @media print { body { padding: 0; } }
      </style></head><body>${parts.join('')}<script>window.onload=()=>setTimeout(()=>window.print(),200);</script></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast.error('تعذّر فتح نافذة الطباعة'); return; }
    w.document.write(html);
    w.document.close();
  }

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <SEOHead />

      {/* رأس الصفحة */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <ScrollText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">قسم الخدمة</h1>
            <p className="text-sm text-muted-foreground">إعداد العظات ودروس مدارس الأحد بمساعدة الذكاء الاصطناعي</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>المحتوى المُولَّد هو <strong>مساعد للتحضير فقط</strong> وليس بديلاً عن الإرشاد الكنسي والدراسة اللاهوتية المعمَّقة.</span>
        </div>
      </div>

      {/* التبويبات: كاهن / خادم */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'clergy' | 'sunday')} className="mb-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="clergy" className="gap-2"><ScrollText className="w-4 h-4" /> للآباء الكهنة</TabsTrigger>
          <TabsTrigger value="sunday" className="gap-2"><GraduationCap className="w-4 h-4" /> لخدام مدارس الأحد</TabsTrigger>
        </TabsList>

        <TabsContent value="clergy" className="mt-4">
          <p className="text-sm text-muted-foreground text-center">إعداد عظة كنسية أرثوذكسية — اكتب الموضوع، استخرج الآيات وتفسيراتها، اقترح هيكلاً.</p>
        </TabsContent>
        <TabsContent value="sunday" className="mt-4">
          <p className="text-sm text-muted-foreground text-center">إعداد درس مدارس أحد — بنفس الأدوات بصياغة مناسبة للأطفال والشباب.</p>
        </TabsContent>
      </Tabs>

      <div className="grid md:grid-cols-3 gap-5">
        {/* ── العمود الأيمن (يحتوي على الأدوات): يحتل 2/3 ── */}
        <div className="md:col-span-2 space-y-5">

          {/* ١. مولّد الهيكل */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold">١. اقتراح هيكل {tab === 'clergy' ? 'العظة' : 'الدرس'}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 mb-3">
              <Input
                placeholder={tab === 'clergy' ? 'موضوع العظة (مثال: التوبة)' : 'موضوع الدرس (مثال: محبة يسوع)'}
                value={topic} onChange={(e) => setTopic(e.target.value)}
              />
              <Input
                placeholder={tab === 'clergy' ? 'الجمهور (شباب، أسر، عام…)' : 'الفئة العمرية (حضانة، ابتدائي…)'}
                value={audience} onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <Button
              onClick={() => outlineMutation.mutate()}
              disabled={outlineMutation.isPending || !topic.trim()}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
            >
              {outlineMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري التوليد…</> : <><Sparkles className="w-4 h-4 ml-2" />اقترح هيكلاً</>}
            </Button>

            {outline && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3 text-sm leading-relaxed">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="font-semibold text-primary mb-1">المقدمة</p>
                  <p>{outline.intro}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="font-semibold text-primary mb-1">النقاط الرئيسية</p>
                  <ol className="list-decimal pr-5 space-y-1">
                    {outline.points.map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </div>
                {outline._type === 'sermon' ? (
                  <>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <p className="font-semibold text-primary mb-1">التطبيق العملي</p>
                      <p>{(outline as SermonOutline).application}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <p className="font-semibold text-primary mb-1">الخاتمة</p>
                      <p>{(outline as SermonOutline).conclusion}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <p className="font-semibold text-primary mb-1">النشاط</p>
                      <p>{(outline as LessonOutline).activity}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <p className="font-semibold text-primary mb-1">الصلاة الختامية</p>
                      <p>{(outline as LessonOutline).prayer}</p>
                    </div>
                  </>
                )}
                {outlineVerses.length > 0 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="font-semibold text-primary mb-2">📖 آيات تتعلق بالموضوع</p>
                    <div className="space-y-2">
                      {outlineVerses.map((v, i) => (
                        <div key={i} className="border-r-2 border-primary/30 pr-3">
                          <span className="text-xs font-medium text-primary/70 block mb-0.5">{v.ref}</span>
                          <p className="font-display text-xl leading-loose text-foreground">{v.text}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <button
                              className="px-3 py-1.5 rounded text-xs font-medium text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={() => openTafsir({ id: i + 90000, bookId: 0, chapter: v.chapter, verse: v.verse, text: v.text, bookName: v.book })}
                            >📖 تفسير الآية</button>
                            <button
                              className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                              onClick={() => {
                                const dv: DraftVerse = { id: i + 90000, bookName: v.book, chapter: v.chapter, verse: v.verse, text: v.text };
                                if (!draft.some(d => d.bookName === v.book && d.chapter === v.chapter && d.verse === v.verse)) {
                                  setDraft(prev => [...prev, dv]);
                                  toast.success('أُضيفت للمسودة');
                                }
                              }}
                            >+ أضف للمسودة</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary/10 flex justify-center">
                      {outlineVersesDone ? (
                        <p className="text-xs text-muted-foreground text-center">✓ تمام، هذه تقريباً كل الآيات المتعلقة بهذا الموضوع</p>
                      ) : (
                        <Button
                          size="sm"
                          style={{ background: 'hsl(345, 55%, 35%)', color: 'hsl(40, 30%, 97%)' }}
                          disabled={outlineVersesLoading || outlineVerses.length >= 150}
                          onClick={() => loadMoreVerses('outline')}
                        >
                          {outlineVersesLoading
                            ? <><Loader2 className="w-3 h-3 ml-1 animate-spin" />جاري الجلب…</>
                            : outlineVerses.length >= 150
                              ? '✓ تمام، 150 آية'
                              : <><Plus className="w-3 h-3 ml-1" />هل تريد المزيد؟</>}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </Card>

          {/* ٢. بحث الآيات */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <SearchIcon className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold">٢. ابحث عن الآيات حسب الموضوع</h2>
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="مثال: الغفران، الصبر، الرجاء…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              />
              <Button onClick={() => runSearch()} disabled={searchMutation.isPending || !query.trim()}>
                {searchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTED_TOPICS.map(t => (
                <button key={t} onClick={() => runSearch(t)}
                  className="px-3 py-1 rounded-full text-xs border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  {t}
                </button>
              ))}
            </div>

            {searchMutation.isPending && (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            )}

            {searchMutation.isSuccess && allResults.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">لا توجد نتائج — جرب موضوعاً آخر</p>
            )}

            <AnimatePresence>
              {allResults.length > 0 && (
                <div className="space-y-2">
                  {allResults.map((v, i) => (
                    <motion.div key={`${v.id}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                      <div className="p-3 border border-border rounded-lg hover:border-primary/40 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{v.bookName} {v.chapter}:{v.verse}</Badge>
                          {v.matchType === 'semantic' && <Badge variant="outline" className="text-xs gap-1"><Sparkles className="w-3 h-3" />مقترح بالذكاء</Badge>}
                        </div>
                        <p className="font-display text-xl leading-loose text-foreground mb-2">{v.text}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openTafsir(v)}
                            className="px-3 py-1.5 rounded text-xs font-medium text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            📖 تفسير الآية
                          </button>
                          <button
                            onClick={() => addToDraft(v)}
                            className="px-3 py-1.5 rounded text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> أضف للمسودة
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {searchMore.map((v, i) => (
                    <motion.div key={`more-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="p-3 border border-border rounded-lg hover:border-primary/40 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{v.book} {v.chapter}:{v.verse}</Badge>
                          <Badge variant="outline" className="text-xs gap-1"><Sparkles className="w-3 h-3" />مقترح بالذكاء</Badge>
                        </div>
                        <p className="font-display text-xl leading-loose text-foreground mb-2">{v.text}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const dv: DraftVerse = { id: 800000 + i, bookName: v.book, chapter: v.chapter, verse: v.verse, text: v.text };
                              if (!draft.some(d => d.bookName === v.book && d.chapter === v.chapter && d.verse === v.verse)) {
                                setDraft(prev => [...prev, dv]);
                                toast.success('أُضيفت للمسودة');
                              }
                            }}
                            className="px-3 py-1.5 rounded text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> أضف للمسودة
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div className="mt-2 pt-3 border-t border-border flex justify-center">
                    {searchDone ? (
                      <p className="text-xs text-muted-foreground text-center">✓ تمام، هذه تقريباً كل الآيات المتعلقة بهذا الموضوع</p>
                    ) : (
                      <Button
                        size="sm"
                        style={{ background: 'hsl(345, 55%, 35%)', color: 'hsl(40, 30%, 97%)' }}
                        disabled={searchMoreLoading || (allResults.length + searchMore.length) >= 150}
                        onClick={() => loadMoreVerses('search')}
                      >
                        {searchMoreLoading
                          ? <><Loader2 className="w-3 h-3 ml-1 animate-spin" />جاري الجلب…</>
                          : (allResults.length + searchMore.length) >= 150
                            ? '✓ تمام، 150 آية'
                            : <><Plus className="w-3 h-3 ml-1" />هل تريد المزيد؟</>}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* ── العمود الأيسر: المسودة (sticky) ── */}
        <div className="md:col-span-1">
          <Card className="p-4 md:sticky md:top-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h2 className="font-semibold">مسودة {tab === 'clergy' ? 'العظة' : 'الدرس'}</h2>
              </div>
              <Badge variant="secondary">{draft.length}</Badge>
            </div>

            {draft.length === 0 && !outline ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                ابدأ بتوليد هيكل أو إضافة آيات من نتائج البحث
              </p>
            ) : (
              <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
                {draft.map((v, i) => (
                  <div key={v.id} className="p-2 bg-muted/40 rounded-lg text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-primary shrink-0">{i + 1}. {v.bookName} {v.chapter}:{v.verse}</span>
                      <button onClick={() => removeFromDraft(v.id)} className="text-muted-foreground hover:text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                    <p className="mt-1 leading-relaxed text-foreground/80">{v.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={copyDraft} variant="outline" className="w-full text-xs" disabled={draft.length === 0 && !outline}>
                <Copy className="w-3.5 h-3.5 ml-2" /> نسخ المسودة
              </Button>
              <Button onClick={printDraft} variant="outline" className="w-full text-xs" disabled={draft.length === 0 && !outline}>
                <Printer className="w-3.5 h-3.5 ml-2" /> طباعة
              </Button>
              {(draft.length > 0 || outline) && (
                <button onClick={clearDraft} className="w-full text-xs text-muted-foreground hover:text-red-500 transition-colors py-1">
                  مسح المسودة
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Sheet التفسير (يعيد استخدام TafsirText) */}
      <Sheet open={tafsirOpen} onOpenChange={setTafsirOpen}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-right">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>تفسير {tafsirRef}</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {tafsirLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : tafsirText ? (
              <TafsirText text={tafsirText} />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-12">لا يوجد تفسير متاح لهذه الآية حالياً</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
