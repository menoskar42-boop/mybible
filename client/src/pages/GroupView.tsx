import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Users, BookOpen, BarChart3, MessageCircle, Settings, Check, X, Copy, Loader2, LogOut, Shield, ShieldOff, Trophy, Award, Target, Share2, AlertTriangle, ArrowRight, Clock, Plus, Eye, Trash2, ChevronDown, ChevronUp, ScrollText, UserPlus, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getUserGroupEntry, addUserGroup, removeUserGroup } from '@/lib/user-groups';
import { fetchBookIntro, fetchVerseTafsir } from '@/lib/tafsir-csv-service';

interface GroupData {
  group: any;
  members: any[];
  stats: { totalMembers: number; readToday: number; chaptersRead: number };
}

function getBadge(count: number): { label: string; color: string } | null {
  if (count >= 100) return { label: 'قارئ أمين', color: 'bg-amber-500 text-white' };
  if (count >= 25) return { label: 'قارئ نشيط', color: 'bg-green-500 text-white' };
  if (count >= 5) return { label: 'قارئ مبتدئ', color: 'bg-blue-500 text-white' };
  return null;
}

function getMedal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds} ثانية`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins} دقيقة و ${secs} ثانية` : `${mins} دقيقة`;
}

const MIN_SECONDS = 40;
const MIN_SCROLLS = 5;
const MIN_DEPTH = 80;

function InlineChapterReader({ bookName, chapter, groupCode, assignmentId, userName, isLastChapter, onComplete }: {
  bookName: string;
  chapter: number;
  groupCode: string;
  assignmentId: number | null;
  userName: string;
  isLastChapter?: boolean;
  onComplete: () => void;
}) {
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [completing, setCompleting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  // تفسير
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirTitle, setTafsirTitle] = useState('');
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  const openTafsir = async (type: 'intro' | 'verse', verseNum?: number) => {
    setTafsirOpen(true);
    setTafsirLoading(true);
    setTafsirText(null);
    if (type === 'intro') {
      setTafsirTitle(`مقدمة عن سفر ${bookName}`);
      const text = await fetchBookIntro(bookName);
      setTafsirText(text || 'لا توجد مقدمة متاحة لهذا السفر حالياً');
    } else if (verseNum !== undefined) {
      setTafsirTitle(`تفسير ${bookName} ${chapter}:${verseNum}`);
      const text = await fetchVerseTafsir(bookName, chapter, verseNum);
      setTafsirText(text || 'لا يوجد تفسير متاح لهذه الآية حالياً');
    }
    setTafsirLoading(false);
  };

  const { data: allBooks } = useQuery({
    queryKey: ['books'],
    queryFn: api.books.getAll,
  });

  useEffect(() => {
    const loadVerses = async () => {
      try {
        if (!allBooks) return;
        const book = allBooks.find((b: any) => b.name === bookName);
        if (!book) { setLoading(false); return; }
        const data = await api.verses.getByBook(book.id, chapter);
        setVerses(data);
        if (assignmentId !== null) {
          fetch(`/api/groups/${groupCode}/assignments/${assignmentId}/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, bookName, chapter }),
          }).catch(() => {});
        }
      } catch {
        toast.error('فشل تحميل الآيات');
      } finally {
        setLoading(false);
      }
    };
    loadVerses();
  }, [bookName, chapter, allBooks]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const currentTop = el.scrollTop;
      if (Math.abs(currentTop - lastScrollTop.current) > 50) {
        setScrollCount(prev => prev + 1);
        lastScrollTop.current = currentTop;
      }
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable > 0) {
        const depth = Math.round((el.scrollTop / scrollable) * 100);
        setScrollDepth(prev => Math.max(prev, depth));
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const condTime = elapsed >= MIN_SECONDS;
  const condScrolls = scrollCount >= MIN_SCROLLS;
  const condDepth = scrollDepth >= MIN_DEPTH;

  const handleFinishReading = async () => {
    setCompleting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      if (assignmentId !== null) {
        const res = await fetch(`/api/groups/${groupCode}/assignments/${assignmentId}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, bookName, chapter, timeSpent, scrollCount, scrollDepth }),
        });
        const data = res.ok ? await res.json() : {};
        if (data.allDone) {
          toast.success('🎉 مبروك! أنهيت كل القراءات المطلوبة اليوم', { duration: 5000 });
        } else {
          toast.success(`تم تسجيل قراءة ${bookName} ${chapter} - ${formatTime(timeSpent)}`);
        }
      } else {
        await fetch(`/api/groups/${groupCode}/reading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, book: bookName, chapter, timeSpent, scrollPercent: scrollDepth }),
        });
        toast.success(`تم تسجيل قراءة ${bookName} ${chapter} - ${formatTime(timeSpent)}`);
      }
      onComplete();
    } catch {
      toast.error('فشل تسجيل القراءة');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* مؤشرات القراءة — للمعلومية فقط */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`flex flex-col items-center p-2 rounded-lg text-xs font-semibold border transition-colors ${condTime ? 'bg-green-50 dark:bg-green-950/30 border-green-300 text-green-700' : 'bg-muted/50 border-border text-muted-foreground'}`}>
          <Clock className="w-4 h-4 mb-1" />
          <span>{elapsed >= MIN_SECONDS ? '✓' : `${elapsed}/${MIN_SECONDS}`} ث</span>
          <span className="text-[10px] font-normal">وقت القراءة</span>
        </div>
        <div className={`flex flex-col items-center p-2 rounded-lg text-xs font-semibold border transition-colors ${condScrolls ? 'bg-green-50 dark:bg-green-950/30 border-green-300 text-green-700' : 'bg-muted/50 border-border text-muted-foreground'}`}>
          <ScrollText className="w-4 h-4 mb-1" />
          <span>{scrollCount >= MIN_SCROLLS ? '✓' : `${scrollCount}/${MIN_SCROLLS}`}</span>
          <span className="text-[10px] font-normal">تمريرات</span>
        </div>
        <div className={`flex flex-col items-center p-2 rounded-lg text-xs font-semibold border transition-colors ${condDepth ? 'bg-green-50 dark:bg-green-950/30 border-green-300 text-green-700' : 'bg-muted/50 border-border text-muted-foreground'}`}>
          <Eye className="w-4 h-4 mb-1" />
          <span>{scrollDepth >= MIN_DEPTH ? '✓' : `${scrollDepth}%`}</span>
          <span className="text-[10px] font-normal">عمق القراءة</span>
        </div>
      </div>

      {/* منطقة القراءة */}
      <div ref={containerRef} className="max-h-[60vh] overflow-y-auto rounded-lg border p-4 bg-background" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-primary">{bookName} - الإصحاح {chapter}</h3>
          <Button variant="outline" size="sm" className="text-xs gap-1 flex-shrink-0" onClick={() => openTafsir('intro')} data-testid="button-book-intro">
            <BookOpen className="w-3.5 h-3.5" />
            مقدمة السفر
          </Button>
        </div>
        <div className="space-y-3">
          {verses.map((v: any) => (
            <div key={v.id} className="group flex gap-2 items-start">
              <p className="flex-1 text-xl leading-loose font-display">
                <span className="text-primary font-bold ml-1">{v.verse}</span>
                {v.text}
              </p>
              <button
                onClick={() => openTafsir('verse', v.verse)}
                className="flex-shrink-0 mt-2 opacity-40 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                title={`تفسير الآية ${v.verse}`}
                data-testid={`button-verse-tafsir-${v.verse}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleFinishReading} disabled={completing} className="w-full" size="lg" data-testid="button-finish-reading">
        {completing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}
        الانتهاء من القراءة
      </Button>

      {/* Dialog التفسير */}
      <Dialog open={tafsirOpen} onOpenChange={setTafsirOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-right">{tafsirTitle}</DialogTitle>
          </DialogHeader>
          {tafsirLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <p className="text-sm leading-loose whitespace-pre-wrap text-foreground font-display" dir="rtl">{tafsirText}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentSection({ groupCode, isAdmin, memberKey, userName, allBooks, onReadComplete }: {
  groupCode: string;
  isAdmin: boolean;
  memberKey: string;
  userName: string;
  allBooks: any[];
  onReadComplete?: () => void;
}) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportAssignmentId, setReportAssignmentId] = useState<number | null>(null);
  const [readingChapter, setReadingChapter] = useState<{ assignmentId: number; bookName: string; chapter: number; isLastChapter: boolean } | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number> | null>(null);
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<number>>(new Set());

  const [assignType, setAssignType] = useState<'daily' | 'weekly'>('daily');
  const [assignTestament, setAssignTestament] = useState<'old' | 'new' | ''>('');
  const [assignBook, setAssignBook] = useState('');
  const [assignChapters, setAssignChapters] = useState<number[]>([]);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');

  const { data: assignmentsData, refetch: refetchAssignments } = useQuery({
    queryKey: ['assignments', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/assignments`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode,
  });

  const assignments = assignmentsData?.assignments || [];

  // فتح كل القراءات بشكل افتراضي، وفتح أي قراءة جديدة تُضاف لاحقاً
  useEffect(() => {
    if (assignments.length === 0) return;
    setExpandedIds(prev => {
      const next = new Set<number>(prev ?? new Set<number>());
      let changed = false;
      for (const a of assignments) {
        if (!next.has(a.id)) { next.add(a.id); changed = true; }
      }
      return changed ? next : (prev ?? next);
    });
  }, [assignments]);

  const currentExpandedIds = expandedIds ?? new Set<number>();

  // جلب progress لكل قراءة مفتوحة بشكل مستقل
  const progressResults = useQueries({
    queries: assignments.map((a: any) => ({
      queryKey: ['assignment-progress', groupCode, a.id],
      queryFn: async () => {
        const res = await fetch(`/api/groups/${groupCode}/assignments/${a.id}/progress`);
        if (!res.ok) throw new Error();
        return res.json();
      },
      enabled: !!groupCode && currentExpandedIds.has(a.id),
    })),
  });

  const getProgressDataForAssignment = (assignmentId: number) => {
    const idx = assignments.findIndex((a: any) => a.id === assignmentId);
    return idx >= 0 ? progressResults[idx]?.data : null;
  };

  const refetchProgress = () => {
    progressResults.forEach(r => r.refetch?.());
  };

  const { data: reportData } = useQuery({
    queryKey: ['assignment-report', groupCode, reportAssignmentId],
    queryFn: async () => {
      if (!reportAssignmentId) return null;
      const res = await fetch(`/api/groups/${groupCode}/assignments/${reportAssignmentId}/admin-report`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!reportAssignmentId,
  });

  const createAssignment = async () => {
    if (!assignBook || assignChapters.length === 0) {
      toast.error('اختر السفر والإصحاحات المطلوبة');
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupCode}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderKey: memberKey,
          userName,
          type: assignType,
          title: assignTitle || null,
          bookName: assignBook,
          chapters: assignChapters,
          deadline: assignDeadline || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم إضافة القراءة المطلوبة');
      setCreateOpen(false);
      setAssignTestament('');
      setAssignBook('');
      setAssignChapters([]);
      setAssignTitle('');
      setAssignDeadline('');
      refetchAssignments();
    } catch {
      toast.error('فشل إنشاء القراءة المطلوبة');
    }
  };

  const deleteAssignment = async (assignmentId: number) => {
    try {
      await fetch(`/api/groups/${groupCode}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey }),
      });
      toast.success('تم حذف القراءة');
      refetchAssignments();
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const handleReadComplete = () => {
    setReadingChapter(null);
    refetchProgress();
    refetchAssignments();
    queryClient.invalidateQueries({ queryKey: ['leaderboard', groupCode] });
    onReadComplete?.();
  };

  const getMyProgress = (assignmentId: number, chapters: number[]) => {
    const pd = getProgressDataForAssignment(assignmentId) as any;
    const mp = pd?.memberProgress?.[userName];
    if (!mp) return { completed: 0, total: chapters.length };
    return { completed: mp.completed || 0, total: chapters.length };
  };

  const isChapterCompleted = (assignmentId: number, chapter: number) => {
    const pd = getProgressDataForAssignment(assignmentId) as any;
    const mp = pd?.memberProgress?.[userName];
    if (!mp) return false;
    return mp.chapters?.[chapter]?.completed || false;
  };

  const getChapterData = (assignmentId: number, chapter: number) => {
    const pd = getProgressDataForAssignment(assignmentId) as any;
    return pd?.memberProgress?.[userName]?.chapters?.[chapter];
  };

  if (readingChapter) {
    return (
      <Card className="p-5 mb-6 border-emerald-200 dark:border-emerald-800/30" data-testid="card-inline-reader">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display font-bold text-foreground">{readingChapter.bookName} {readingChapter.chapter}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setReadingChapter(null)} data-testid="button-close-reader">
            <X className="w-4 h-4 ml-1" />
            إغلاق
          </Button>
        </div>
        <InlineChapterReader
          bookName={readingChapter.bookName}
          chapter={readingChapter.chapter}
          groupCode={groupCode}
          assignmentId={readingChapter.assignmentId}
          userName={userName}
          isLastChapter={readingChapter.isLastChapter}
          onComplete={handleReadComplete}
        />
      </Card>
    );
  }

  return (
    <>
      {assignments.length > 0 && assignments.every((a: any) => {
        const p = getMyProgress(a.id, a.chapters || []);
        return p.completed >= p.total && p.total > 0;
      }) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 text-center mb-4">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-display font-bold text-green-700 dark:text-green-400">مبروك! أنهيت كل القراءات المطلوبة</p>
          <p className="text-xs text-green-600/80 dark:text-green-400/70 mt-1">«اَلَّذِينَ يَزْرَعُونَ بِالدُّمُوعِ يَحْصُدُونَ بِالتَّرَنُّمِ» (مز ١٢٦: ٥)</p>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="mb-6 space-y-4">
          {assignments.map((a: any) => {
            const chapters = (a.chapters as number[]) || [];
            const isExpanded = currentExpandedIds.has(a.id);
            const myProg = getMyProgress(a.id, chapters);
            const isDone = myProg.completed >= myProg.total && myProg.total > 0;

            return (
              <Card key={a.id} className="p-5 border-emerald-200 dark:border-emerald-800/30" data-testid={`card-assignment-${a.id}`}>
                <div
                  className="flex items-center justify-between mb-2 cursor-pointer select-none"
                  onClick={() => setExpandedIds(prev => {
                    const next = new Set<number>(prev ?? new Set<number>());
                    if (next.has(a.id)) next.delete(a.id); else next.add(a.id);
                    return next;
                  })}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-foreground text-sm">{a.title || `قراءة ${a.type === 'daily' ? 'يومية' : 'أسبوعية'}`}</h4>
                        <Badge variant={a.type === 'daily' ? 'default' : 'secondary'} className="text-xs">
                          {a.type === 'daily' ? 'يومية' : 'أسبوعية'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.bookName} - {chapters.length} إصحاح</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setReportAssignmentId(a.id); setReportOpen(true); }} data-testid={`button-report-${a.id}`}>
                          <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deleteAssignment(a.id); }} data-testid={`button-delete-assignment-${a.id}`}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </>
                    )}
                    <div className="h-7 w-7 flex items-center justify-center" data-testid={`button-expand-${a.id}`}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
                {a.deadline && <p className="text-xs text-muted-foreground mb-2">الموعد النهائي: {a.deadline}</p>}

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">تقدمك</span>
                      <span className="font-semibold">{myProg.completed} / {myProg.total} إصحاح</span>
                    </div>
                    <Progress value={myProg.total > 0 ? Math.min((myProg.completed / myProg.total) * 100, 100) : 0} className="h-2 mb-3" />

                    {isDone && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-center mb-3">
                        <p className="text-amber-700 dark:text-amber-400 font-bold text-sm">✝️ أحسنت! أكملت قراءة {a.bookName}</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">«مَنْ يَثْبُتْ إِلَى الْمُنْتَهَى فَذَاكَ يَخْلُصُ» (مت ٢٤: ١٣)</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {chapters.map((ch: number) => {
                        const done = isChapterCompleted(a.id, ch);
                        const chapterData = getChapterData(a.id, ch);
                        return (
                          <button
                            key={ch}
                            onClick={() => {
                              if (done) return;
                              const remaining = chapters.filter((c: number) => !isChapterCompleted(a.id, c));
                              setReadingChapter({ assignmentId: a.id, bookName: a.bookName, chapter: ch, isLastChapter: remaining.length === 1 });
                            }}
                            disabled={done}
                            className={`relative p-3 rounded-lg border text-center transition-all ${
                              done
                                ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800'
                                : 'bg-background border-border hover:border-primary hover:shadow-md cursor-pointer'
                            }`}
                            data-testid={`button-chapter-${a.id}-${ch}`}
                          >
                            <span className={`font-bold text-lg ${done ? 'text-green-600' : 'text-foreground'}`}>{ch}</span>
                            {done && (
                              <div className="mt-1">
                                <Check className="w-4 h-4 text-green-500 mx-auto" />
                                {chapterData && (
                                  <span className="text-[10px] text-green-600 block mt-0.5">{formatTime(chapterData.timeSpent)}</span>
                                )}
                              </div>
                            )}
                            {!done && <p className="text-[10px] text-muted-foreground mt-1">اضغط للقراءة</p>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <Card className="p-5 mb-6 border-dashed border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCreateOpen(true)} data-testid="card-create-assignment">
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Plus className="w-5 h-5" />
            <span className="font-bold">إضافة قراءة مطلوبة للمجموعة</span>
          </div>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setAssignTestament(''); setAssignBook(''); setAssignChapters([]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة قراءة مطلوبة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* نوع القراءة */}
            <div>
              <Label>نوع القراءة</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={assignType === 'daily' ? 'default' : 'outline'} size="sm" onClick={() => setAssignType('daily')} data-testid="button-type-daily">يومية</Button>
                <Button variant={assignType === 'weekly' ? 'default' : 'outline'} size="sm" onClick={() => setAssignType('weekly')} data-testid="button-type-weekly">أسبوعية</Button>
              </div>
            </div>

            {/* عنوان */}
            <div>
              <Label>عنوان (اختياري)</Label>
              <Input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="مثال: قراءة يوم الأحد" data-testid="input-assign-title" />
            </div>

            {/* العهد */}
            <div>
              <Label>العهد</Label>
              <select
                value={assignTestament}
                onChange={e => { setAssignTestament(e.target.value as 'old' | 'new' | ''); setAssignBook(''); setAssignChapters([]); }}
                className="w-full border rounded-md p-2 bg-background text-foreground"
                data-testid="select-assign-testament"
              >
                <option value="">اختر العهد</option>
                <option value="old">العهد القديم</option>
                <option value="new">العهد الجديد</option>
              </select>
            </div>

            {/* السفر */}
            {assignTestament && (
              <div>
                <Label>السفر</Label>
                <select
                  value={assignBook}
                  onChange={e => { setAssignBook(e.target.value); setAssignChapters([]); }}
                  className="w-full border rounded-md p-2 bg-background text-foreground"
                  data-testid="select-assign-book"
                >
                  <option value="">اختر السفر</option>
                  {allBooks?.filter((b: any) => b.testament === assignTestament).map((b: any) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* الإصحاحات */}
            {assignBook && (() => {
              const book = allBooks?.find((b: any) => b.name === assignBook);
              const total = book?.chaptersCount || 0;
              return total > 0 ? (
                <div>
                  <Label>الإصحاحات المطلوبة ({assignChapters.length} مختار)</Label>
                  <div className="flex gap-2 mb-2 mt-1 flex-wrap">
                    <Button type="button" size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => setAssignChapters(Array.from({ length: total }, (_, i) => i + 1))}>
                      اختر الكل
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => setAssignChapters([])}>
                      مسح الكل
                    </Button>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1">
                    {Array.from({ length: total }, (_, i) => i + 1).map(ch => {
                      const selected = assignChapters.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setAssignChapters(prev =>
                            selected ? prev.filter(c => c !== ch) : [...prev, ch].sort((a, b) => a - b)
                          )}
                          className={`rounded-md py-1.5 text-sm font-semibold border transition-colors ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:border-primary'
                          }`}
                          data-testid={`chapter-btn-${ch}`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {assignType === 'weekly' && (
              <div>
                <Label>الموعد النهائي</Label>
                <Input type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} data-testid="input-assign-deadline" />
              </div>
            )}

            <Button onClick={createAssignment} className="w-full" data-testid="button-create-assignment">إضافة القراءة</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={(o) => { setReportOpen(o); if (!o) setReportAssignmentId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500" />
              تقرير متابعة القراءة
            </DialogTitle>
          </DialogHeader>
          {reportData?.report ? (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm flex items-center justify-between">
                <div>
                  <p className="font-bold">{reportData.assignment?.title || reportData.assignment?.bookName}</p>
                  <p className="text-muted-foreground">{reportData.assignment?.bookName} — {(reportData.assignment?.chapters as number[])?.length} إصحاح</p>
                </div>
                <div className="text-left text-xs text-muted-foreground space-y-1">
                  <p>أنهوا: <span className="font-bold text-green-600">{reportData.report.filter((m: any) => m.completedChapters === m.totalChapters).length}</span></p>
                  <p>في التقدم: <span className="font-bold text-amber-600">{reportData.report.filter((m: any) => m.completedChapters > 0 && m.completedChapters < m.totalChapters).length}</span></p>
                  <p>لم يبدأوا: <span className="font-bold text-red-500">{reportData.report.filter((m: any) => m.completedChapters === 0 && !m.openedChapters).length}</span></p>
                </div>
              </div>

              {reportData.report.map((m: any) => {
                const pct = m.totalChapters > 0 ? (m.completedChapters / m.totalChapters) * 100 : 0;
                const isComplete = m.completedChapters === m.totalChapters;
                const hasStarted = m.completedChapters > 0 || m.openedChapters > 0;
                return (
                  <Card key={m.userName} className={`p-4 border-l-4 ${isComplete ? 'border-l-green-500' : hasStarted ? 'border-l-amber-400' : 'border-l-red-400'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{m.userName}</span>
                          {isComplete && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 text-xs">✓ أنهى</Badge>}
                          {!isComplete && hasStarted && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 text-xs">جارٍ</Badge>}
                          {!hasStarted && <Badge variant="outline" className="text-red-500 text-xs">لم يبدأ</Badge>}
                        </div>
                        {m.lastActivity && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            آخر نشاط: {new Date(m.lastActivity).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{m.completedChapters}/{m.totalChapters} إصحاح</span>
                        {m.totalTime > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(m.totalTime)}</span>}
                        {m.avgScrollDepth > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{m.avgScrollDepth}% عمق</span>}
                      </div>
                    </div>

                    <Progress value={Math.min(pct, 100)} className={`h-1.5 mb-3 ${isComplete ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-400'}`} />

                    <div className="flex flex-wrap gap-1.5">
                      {m.chapterDetails.map((cd: any) => {
                        let bg = 'bg-muted/60 text-muted-foreground border border-border';
                        let icon = '—';
                        let tooltip = 'لم يُفتح بعد';
                        if (cd.completed) {
                          const qual = cd.quality;
                          bg = qual === 'genuine'
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-300'
                            : qual === 'fast'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 border border-orange-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border border-blue-300';
                          icon = '✓';
                          tooltip = `${formatTime(cd.timeSpent)} — عمق ${cd.scrollDepth}%${cd.completedAt ? ' — ' + new Date(cd.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}`;
                        } else if (cd.opened) {
                          bg = 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border border-amber-300';
                          icon = '◑';
                          tooltip = `فتح الإصحاح${cd.openedAt ? ' الساعة ' + new Date(cd.openedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''} ولم يكمل`;
                        }
                        return (
                          <div key={cd.chapter} className={`text-[11px] px-2 py-1 rounded-md font-mono ${bg} cursor-default select-none`} title={tooltip}>
                            <span className="font-semibold">{cd.chapter}</span>
                            <span className="mr-1">{icon}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                      <span>✓ أنهى</span>
                      <span className="text-green-600">■ متأنٍ</span>
                      <span className="text-blue-600">■ عادي</span>
                      <span className="text-orange-500">■ سريع</span>
                      <span className="text-amber-600">◑ فتح فقط</span>
                      <span>— لم يفتح</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function GroupView() {
  const params = useParams<{ groupId: string }>();
  const groupCode = params.groupId || '';
  const [, navigate] = useLocation();
  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [challengeTotal, setChallengeTotal] = useState('');
  const [copied, setCopied] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminName, setAddAdminName] = useState('');
  const [addAdminPhone, setAddAdminPhone] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminResult, setAddAdminResult] = useState<string | null>(null);
  const [linkJoinMode, setLinkJoinMode] = useState<'approval' | 'auto'>('approval');
  const [linkModeLoading, setLinkModeLoading] = useState(false);
  const [reportActiveOpen, setReportActiveOpen] = useState(false);
  const [reportInactiveOpen, setReportInactiveOpen] = useState(false);

  const [missionTitle, setMissionTitle] = useState('');
  const [missionBook, setMissionBook] = useState('');
  const [missionStart, setMissionStart] = useState('');
  const [missionEnd, setMissionEnd] = useState('');
  const [missionDeadline, setMissionDeadline] = useState('');

  const stored = JSON.parse(localStorage.getItem(`group_${groupCode}`) || '{}');
  const userEntry = getUserGroupEntry(groupCode);
  const isAdmin = userEntry?.role === 'admin' || stored.isLeader || false;
  const memberKey = userEntry?.memberKey || stored.memberKey || '';
  const userName = userEntry?.userName || stored.userName || '';

  // Reactive admin state — starts from localStorage, updated when server confirms admin
  const [isAdminConfirmed, setIsAdminConfirmed] = useState(isAdmin);

  const { data: allBooks } = useQuery({
    queryKey: ['books'],
    queryFn: api.books.getAll,
  });

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupCode}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
      setChallengeTotal(d.group.challengeTotal?.toString() || '');
      setLinkJoinMode((d.group.linkJoinMode as 'approval' | 'auto') || 'approval');
    } catch {
      toast.error('فشل تحميل بيانات المجموعة');
    } finally {
      setLoading(false);
    }
  }, [groupCode]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  useEffect(() => {
    if (!data || !userName) return;
    const { members: mbs, group: grp } = data as any;
    // Find by exact match or by name+isAdmin (fallback when memberKey is missing)
    const me = mbs?.find((m: any) => m.userName === userName && m.memberKey === memberKey)
      || (memberKey ? null : mbs?.find((m: any) => m.userName === userName && m.isAdmin === true));
    const serverIsAdmin = me?.isAdmin === true || grp?.leaderKey === memberKey;
    if (serverIsAdmin) {
      if (!isAdminConfirmed) setIsAdminConfirmed(true);
      if (!isAdmin) {
        const restoredKey = me?.memberKey || memberKey;
        const entry = getUserGroupEntry(groupCode);
        addUserGroup({
          ...(entry || {}),
          groupId: groupCode,
          groupName: grp?.name || entry?.groupName || '',
          churchName: grp?.churchName || entry?.churchName || '',
          role: 'admin',
          userName: userName,
          memberKey: restoredKey,
        } as any);
        const curr = JSON.parse(localStorage.getItem(`group_${groupCode}`) || '{}');
        localStorage.setItem(`group_${groupCode}`, JSON.stringify({ ...curr, isLeader: true, memberKey: restoredKey, userName }));
      }
    }
  }, [data, memberKey, userName, groupCode, isAdmin, isAdminConfirmed]);

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/leaderboard`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode,
  });

  const { data: missionData, refetch: refetchMission } = useQuery({
    queryKey: ['mission', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/missions`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode,
  });

  const { data: pageAssignmentsData } = useQuery({
    queryKey: ['assignments', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/assignments`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode,
  });
  const todayAssignment = ((pageAssignmentsData?.assignments || []) as any[]).find(
    (a: any) => a.type === 'daily' && a.isActive !== false
  ) ?? null;

  const { data: leaderReport } = useQuery({
    queryKey: ['leader-report', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/leader-report?leaderKey=${encodeURIComponent(memberKey)}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode && isAdminConfirmed,
  });

  const queryClient = useQueryClient();

  const { data: joinRequestsData, refetch: refetchJoinRequests } = useQuery({
    queryKey: ['join-requests', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/join-requests`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode && isAdminConfirmed,
  });

  const joinRequests = joinRequestsData?.joinRequests || [];

  const handleApproveRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/join-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم قبول العضو');
      refetchJoinRequests();
      fetchGroup();
    } catch {
      toast.error('فشل قبول الطلب');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/join-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم رفض الطلب');
      refetchJoinRequests();
    } catch {
      toast.error('فشل رفض الطلب');
    }
  };

  const updateToday = async () => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/today`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderKey: memberKey,
          challengeTotal: challengeTotal ? parseInt(challengeTotal) : 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم تحديث قراءة اليوم');
      setAdminOpen(false);
      fetchGroup();
    } catch {
      toast.error('فشل التحديث');
    }
  };

  const createMission = async () => {
    if (!missionTitle || !missionBook || !missionStart || !missionEnd || !missionDeadline) {
      toast.error('جميع الحقول مطلوبة');
      return;
    }
    try {
      const res = await fetch(`/api/groups/${groupCode}/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderKey: memberKey,
          userName,
          title: missionTitle,
          bookName: missionBook,
          startChapter: parseInt(missionStart),
          endChapter: parseInt(missionEnd),
          deadline: missionDeadline,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم إنشاء المهمة');
      setMissionOpen(false);
      setMissionTitle('');
      setMissionBook('');
      setMissionStart('');
      setMissionEnd('');
      setMissionDeadline('');
      refetchMission();
    } catch {
      toast.error('فشل إنشاء المهمة');
    }
  };

  const shareMission = async () => {
    const mission = missionData?.mission;
    if (!mission) return;
    const text = `انضم لمجموعة القراءة الروحية هذا الأسبوع واقرأ معنا ${mission.bookName} من الإصحاح ${mission.startChapter} إلى ${mission.endChapter}\n\nكود المجموعة: ${groupCode}\nhttps://mybible.oscardevs.com/groups/join`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'مهمة القراءة الأسبوعية', text });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    toast.success('تم نسخ رابط المهمة');
  };

  const removeMember = async (memberName: string) => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/members/${encodeURIComponent(memberName)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم حذف العضو');
      fetchGroup();
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const toggleMute = async (memberName: string, muted: boolean) => {
    try {
      await fetch(`/api/groups/${groupCode}/members/${encodeURIComponent(memberName)}/mute`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey, muted }),
      });
      toast.success(muted ? 'تم كتم العضو' : 'تم إلغاء الكتم');
      fetchGroup();
    } catch {
      toast.error('فشل');
    }
  };

  const toggleAdmin = async (memberName: string, setAsAdmin: boolean) => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/members/${encodeURIComponent(memberName)}/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey, isAdmin: setAsAdmin }),
      });
      if (!res.ok) throw new Error();
      toast.success(setAsAdmin ? 'تم تعيينه كأدمن' : 'تم إزالة صلاحية الأدمن');
      fetchGroup();
    } catch {
      toast.error('فشل تغيير الدور');
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopied(true);
      toast.success('تم نسخ الكود');
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const leaveGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberKey }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'فشل المغادرة');
        return;
      }
      removeUserGroup(groupCode);
      toast.success('تم مغادرة المجموعة');
      navigate('/groups');
    } catch {
      toast.error('فشل المغادرة');
    }
  };

  const handleCopyInviteLink = async () => {
    const link = `${window.location.origin}/invite/${groupCode}`;
    const shareText = `انضم لمجموعة "${data?.group?.name || groupCode}" في تطبيق الكتاب المقدس رفيقي:\n${link}`;
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('تم نسخ رابط الدعوة — شاركه مع أعضاء مجموعتك');
    } catch {
      // clipboard غير متاح — نعرض الرابط في toast
      toast.info(link, { duration: 8000 });
    }
  };

  const handleToggleLinkMode = async (newMode: 'approval' | 'auto') => {
    setLinkModeLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/link-mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey, mode: newMode }),
      });
      if (!res.ok) throw new Error();
      setLinkJoinMode(newMode);
      toast.success(newMode === 'auto' ? 'الانضمام أصبح فورياً عبر الرابط' : 'الانضمام يتطلب موافقتك الآن');
    } catch {
      toast.error('فشل تحديث الإعداد');
    } finally {
      setLinkModeLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!addAdminName.trim() || !addAdminPhone.trim()) {
      toast.error('الاسم ورقم الموبايل مطلوبان');
      return;
    }
    if (addAdminPhone.trim().length < 10) {
      toast.error('رقم الموبايل غير صحيح');
      return;
    }
    setAddAdminLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/add-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey, name: addAdminName.trim(), phone: addAdminPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddAdminResult(data.memberKey);
      fetchGroup();
    } catch (err: any) {
      toast.error(err.message || 'فشل إضافة الأدمن');
    } finally {
      setAddAdminLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="p-8 text-center">
          <h2 className="font-display text-xl font-bold mb-2">المجموعة غير موجودة</h2>
          <Link href="/groups"><Button variant="outline">العودة</Button></Link>
        </Card>
      </div>
    );
  }

  const { group, members, stats } = data;
  const isMember = members.some((m: any) =>
    (m.userName === userName && m.memberKey === memberKey) ||
    (m.userName === userName && m.isAdmin === true && !memberKey)
  );

  const serverMember = members.find((m: any) => m.userName === userName && m.memberKey === memberKey);
  // Fallback: if memberKey is missing but name matches leader name
  const serverMemberByName = !serverMember && userName ? members.find((m: any) => m.userName === userName && m.isAdmin === true) : null;
  const isAdminFinal = isAdmin || serverMember?.isAdmin === true || group.leaderKey === memberKey || !!serverMemberByName;

  if (!isMember && !isAdminFinal) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold mb-2">أنت لست عضواً في هذه المجموعة</h2>
          <p className="text-sm text-muted-foreground mb-4">اطلب من الخادم المسؤول قبول طلب الانضمام</p>
          <Link href="/groups"><Button variant="outline">العودة لمجموعاتي</Button></Link>
        </Card>
      </div>
    );
  }
  const progress = group.challengeTotal > 0 ? Math.round((stats.chaptersRead / group.challengeTotal) * 100) : 0;
  const leaderboard = leaderboardData?.leaderboard || [];
  const mission = missionData?.mission || null;
  const myMissionProgress = mission && missionData?.memberProgress ? (missionData.memberProgress[userName] || 0) : 0;
  const missionTotal = missionData?.totalChapters || 0;
  const missionCompleted = missionTotal > 0 && myMissionProgress >= missionTotal;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <SEOHead />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              {group.churchName && <p className="text-sm font-semibold text-muted-foreground">{group.churchName}</p>}
              <h1 className="font-display text-2xl font-bold text-foreground">{group.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={copyCode} data-testid="button-copy-group-code">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopyInviteLink} title="مشاركة رابط الانضمام" data-testid="button-share-invite">
              <Link2 className="w-4 h-4" />
            </Button>
            {isAdminFinal && (
              <Button variant="ghost" size="icon" onClick={() => setAdminOpen(true)} data-testid="button-admin">
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate('/groups')} data-testid="button-back-groups">
              <ArrowRight className="w-4 h-4 ml-1" />
              رجوع
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Badge variant="secondary">كود: {groupCode}</Badge>
          <Badge variant="outline">الأدمن: {group.leaderName}</Badge>
          {isAdminFinal && <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 gap-1"><Shield className="w-3 h-3" /> أدمن</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* قراءة اليوم — مخفية مؤقتاً */}

          <Card className="p-5" data-testid="card-group-stats">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <h3 className="font-display font-bold text-foreground">تقدم المجموعة</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الأعضاء</span>
                <span className="font-semibold">{stats.totalMembers} عضو</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">قرأوا اليوم</span>
                <span className="font-semibold text-green-600">{stats.readToday}</span>
              </div>
              {group.challengeTotal > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">تحدي القراءة</span>
                    <span className="font-semibold">{stats.chaptersRead} / {group.challengeTotal}</span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div id="assignment-section">
          <AssignmentSection
            groupCode={groupCode}
            isAdmin={isAdminFinal}
            memberKey={memberKey}
            userName={userName}
            allBooks={allBooks || []}
            onReadComplete={fetchGroup}
          />
        </div>

        {mission && (
          <Card className="p-5 mb-6 border-amber-200 dark:border-amber-800/30" data-testid="card-mission">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-bold text-foreground">مهمة القراءة الأسبوعية</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={shareMission} data-testid="button-share-mission">
                <Share2 className="w-4 h-4 ml-1" />
                مشاركة
              </Button>
            </div>
            <p className="font-semibold text-primary mb-2">{mission.title}</p>
            <p className="text-sm text-muted-foreground mb-3">
              {mission.bookName} - الإصحاح {mission.startChapter} إلى {mission.endChapter} | الموعد: {mission.deadline}
            </p>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">تقدمك</span>
                <span className="font-semibold">{myMissionProgress} / {missionTotal} إصحاح</span>
              </div>
              <Progress value={missionTotal > 0 ? Math.min((myMissionProgress / missionTotal) * 100, 100) : 0} className="h-2" />
            </div>
            {missionCompleted && (
              <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                <p className="text-green-600 dark:text-green-400 font-bold text-sm">🎉 مبروك! أنهيت مهمة القراءة</p>
              </div>
            )}
            {missionData?.groupProgress !== undefined && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">تقدم المجموعة هذا الأسبوع</span>
                  <span className="font-semibold">{missionData.groupProgress}%</span>
                </div>
                <Progress value={missionData.groupProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{missionData.completedMembers} من {missionData.totalMembers} أكملوا المهمة</p>
              </div>
            )}
          </Card>
        )}

        {isAdminFinal && !mission && (
          <Card className="p-5 mb-6 border-dashed border-2 border-amber-300 dark:border-amber-700 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setMissionOpen(true)} data-testid="card-create-mission">
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <Target className="w-5 h-5" />
              <span className="font-bold">إنشاء مهمة قراءة أسبوعية</span>
            </div>
          </Card>
        )}

        {leaderboard.length > 0 && (
          <Card className="p-5 mb-6" data-testid="card-leaderboard">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-foreground">ترتيب القراءة في المجموعة</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => {
                const badge = getBadge(entry.chaptersReadCount);
                return (
                  <div key={entry.userName} className={`flex items-center justify-between py-2 px-3 rounded-lg ${i < 3 ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-8 text-center">{getMedal(i)}</span>
                      <span className="font-medium text-sm">{entry.userName}</span>
                      {badge && (
                        <Badge className={`text-xs ${badge.color}`}>
                          <Award className="w-3 h-3 ml-0.5" />
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">{entry.chaptersReadCount} إصحاح</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {isAdminFinal && joinRequests.length > 0 && (
          <Card className="p-5 mb-4 border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10" data-testid="card-join-requests">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-foreground">طلبات انضمام ({joinRequests.length})</h3>
            </div>
            <div className="space-y-2">
              {joinRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium">{req.userName}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproveRequest(req.id)}
                      data-testid={`button-approve-${req.id}`}
                    >
                      <Check className="w-3 h-3 ml-1" />
                      قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => handleRejectRequest(req.id)}
                      data-testid={`button-reject-${req.id}`}
                    >
                      <X className="w-3 h-3 ml-1" />
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link href={`/group/${groupCode}/members`}>
            <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid="card-members">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-display font-bold text-foreground">الأعضاء</h3>
              </div>
              <p className="text-3xl font-bold text-center my-2 text-foreground">{members.length}</p>
              <p className="text-sm text-muted-foreground text-center mb-3">
                <span className="text-green-600 font-semibold">{members.filter((m: any) => m.readToday).length}</span> قرأوا اليوم
              </p>
              <Button variant="outline" size="sm" className="w-full">عرض الأعضاء</Button>
            </Card>
          </Link>

          <Link href={`/group/${groupCode}/chat`}>
            <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid="card-chat">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                <h3 className="font-display font-bold text-foreground">شات المجموعة</h3>
              </div>
              <p className="text-sm text-muted-foreground">تواصل مع أعضاء المجموعة وشارك آيات</p>
              <Button variant="outline" size="sm" className="mt-3 w-full">فتح الشات</Button>
            </Card>
          </Link>
        </div>

        {isAdminFinal && leaderReport && (
          <Card className="p-5 mb-6 border-indigo-200 dark:border-indigo-800/30" data-testid="card-leader-report">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-display font-bold text-foreground">تقرير الخادم</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">اسم المجموعة</span>
                <span className="font-semibold">{leaderReport.groupName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">عدد الأعضاء</span>
                <span className="font-semibold">{leaderReport.totalMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">إصحاحات هذا الأسبوع</span>
                <span className="font-semibold text-green-600">{leaderReport.chaptersThisWeek}</span>
              </div>
              <div className="mt-3 pt-3 border-t flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-green-700 border-green-300"
                  onClick={() => setReportActiveOpen(true)}>
                  قرأوا ({leaderReport.activeMembers?.length || 0})
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-amber-700 border-amber-300"
                  onClick={() => setReportInactiveOpen(true)}>
                  لم يقرأوا ({leaderReport.inactiveMembers?.length || 0})
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-center">
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={leaveGroup} data-testid="button-leave-group">
            <LogOut className="w-4 h-4 ml-2" />
            مغادرة المجموعة
          </Button>
        </div>

        {/* ── تقرير: الأعضاء الذين قرأوا ── */}
        <Dialog open={reportActiveOpen} onOpenChange={setReportActiveOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-green-700">الأعضاء الذين قرأوا هذا الأسبوع ({leaderReport?.activeMembers?.length || 0})</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {(leaderReport?.activeMembers || []).map((m: any) => (
                <div key={m.userName} className="border rounded-lg p-3">
                  <p className="font-bold text-foreground mb-2">{m.userName}</p>
                  <div className="space-y-2">
                    {m.chapters.map((ch: any, i: number) => (
                      <div key={i} className="bg-muted/40 rounded p-2 text-xs space-y-1">
                        <p className="font-semibold text-sm">{ch.bookName} — إصحاح {ch.chapter}</p>
                        <div className="grid grid-cols-3 gap-1 text-muted-foreground">
                          <span>⏱ {Math.round((ch.timeSpent || 0) / 60)} د {(ch.timeSpent || 0) % 60} ث</span>
                          <span>📜 سكرول: {ch.scrollCount || 0}</span>
                          <span>📊 عمق: {ch.scrollDepth || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!leaderReport?.activeMembers?.length) && (
                <p className="text-center text-muted-foreground py-4">لا يوجد أعضاء قرأوا هذا الأسبوع</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── تقرير: الأعضاء الذين لم يقرأوا ── */}
        <Dialog open={reportInactiveOpen} onOpenChange={setReportInactiveOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-amber-700">لم يقرأوا منذ 3+ أيام ({leaderReport?.inactiveMembers?.length || 0})</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-1">
              {(leaderReport?.inactiveMembers || []).map((name: string) => (
                <div key={name} className="flex items-center gap-2 py-2 border-b last:border-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-foreground">{name}</span>
                </div>
              ))}
              {(!leaderReport?.inactiveMembers?.length) && (
                <p className="text-center text-muted-foreground py-4">🎉 كل الأعضاء قرأوا مؤخراً</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إدارة المجموعة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>إجمالي تحدي القراءة (عدد الإصحاحات)</Label>
                <Input type="number" min="0" value={challengeTotal} onChange={e => setChallengeTotal(e.target.value)} data-testid="input-challenge-total" />
              </div>
              <Button onClick={updateToday} className="w-full" data-testid="button-save-admin">حفظ التغييرات</Button>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-indigo-500" />
                  <Label className="font-bold">رابط الدعوة</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleCopyInviteLink} data-testid="button-copy-invite-link">
                    <Copy className="w-3.5 h-3.5 ml-1" />
                    نسخ الرابط
                  </Button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button variant="outline" size="sm" className="flex-1 text-xs" data-testid="button-share-invite-native"
                      onClick={async () => {
                        const link = `${window.location.origin}/invite/${groupCode}`;
                        try {
                          await navigator.share({ url: link });
                        } catch {
                          handleCopyInviteLink();
                        }
                      }}>
                      <Share2 className="w-3.5 h-3.5 ml-1" />
                      مشاركة
                    </Button>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">وضع الانضمام عبر الرابط</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={linkJoinMode === 'approval' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={linkModeLoading}
                      onClick={() => handleToggleLinkMode('approval')}
                      data-testid="button-mode-approval"
                    >
                      بعد موافقتي
                    </Button>
                    <Button
                      variant={linkJoinMode === 'auto' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={linkModeLoading}
                      onClick={() => handleToggleLinkMode('auto')}
                      data-testid="button-mode-auto"
                    >
                      انضمام فوري
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {linkJoinMode === 'auto' ? 'كل من يفتح الرابط ينضم فوراً بدون موافقة' : 'تصلك طلبات ويمكنك قبول أو رفض كل شخص'}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={missionOpen} onOpenChange={setMissionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مهمة قراءة أسبوعية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>عنوان المهمة</Label>
                <Input value={missionTitle} onChange={e => setMissionTitle(e.target.value)} placeholder="مثال: اقرأ إنجيل مرقس هذا الأسبوع" data-testid="input-mission-title" />
              </div>
              <div>
                <Label>السفر</Label>
                <select
                  value={missionBook}
                  onChange={e => setMissionBook(e.target.value)}
                  className="w-full border rounded-md p-2 bg-background text-foreground"
                  data-testid="select-mission-book"
                >
                  <option value="">اختر السفر</option>
                  {allBooks?.map((b: any) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>من إصحاح</Label>
                  <Input type="number" min="1" value={missionStart} onChange={e => setMissionStart(e.target.value)} data-testid="input-mission-start" />
                </div>
                <div>
                  <Label>إلى إصحاح</Label>
                  <Input type="number" min="1" value={missionEnd} onChange={e => setMissionEnd(e.target.value)} data-testid="input-mission-end" />
                </div>
              </div>
              <div>
                <Label>الموعد النهائي</Label>
                <Input type="date" value={missionDeadline} onChange={e => setMissionDeadline(e.target.value)} data-testid="input-mission-deadline" />
              </div>
              <Button onClick={createMission} className="w-full" data-testid="button-create-mission">إنشاء المهمة</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={addAdminOpen} onOpenChange={(o) => { setAddAdminOpen(o); if (!o) setAddAdminResult(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                إضافة أدمن للمجموعة
              </DialogTitle>
            </DialogHeader>
            {addAdminResult ? (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-bold text-foreground">تم إضافة {addAdminName} كأدمن</p>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-2">شارك هذا الكود الشخصي مع الأدمن الجديد ليسجل دخوله</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="font-mono text-sm font-bold text-primary bg-background px-3 py-1.5 rounded-lg border" data-testid="text-new-admin-key">{addAdminResult}</code>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(addAdminResult); toast.success('تم النسخ'); }} data-testid="button-copy-admin-key">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">يمكنه الانضمام بكود المجموعة <strong>{groupCode}</strong> باستخدام اسمه ورقم موبايله</p>
                <Button onClick={() => setAddAdminOpen(false)} className="w-full" data-testid="button-close-add-admin">إغلاق</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-name">الاسم *</Label>
                  <Input id="admin-name" value={addAdminName} onChange={e => setAddAdminName(e.target.value)} placeholder="اكتب اسم الأدمن الجديد" data-testid="input-add-admin-name" />
                </div>
                <div>
                  <Label htmlFor="admin-phone">رقم الموبايل *</Label>
                  <Input id="admin-phone" value={addAdminPhone} onChange={e => setAddAdminPhone(e.target.value)} placeholder="01000000000" type="tel" dir="ltr" className="text-left" data-testid="input-add-admin-phone" />
                </div>
                <p className="text-xs text-muted-foreground">سيُضاف هذا الشخص مباشرة كأدمن ويمكنه تسجيل الدخول بنفس الاسم والرقم</p>
                <Button onClick={handleAddAdmin} disabled={addAdminLoading} className="w-full" data-testid="button-submit-add-admin">
                  {addAdminLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                  إضافة كأدمن
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </motion.div>
    </div>
  );
}
