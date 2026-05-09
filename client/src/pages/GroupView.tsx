import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Users, BookOpen, BarChart3, MessageCircle, Settings, Check, X, Copy, Loader2, LogOut, Shield, ShieldOff, Trophy, Award, Target, Share2, AlertTriangle, ArrowRight, Clock, Plus, Eye, Trash2, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getUserGroupEntry, addUserGroup, removeUserGroup } from '@/lib/user-groups';

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

function InlineChapterReader({ bookName, chapter, groupCode, assignmentId, userName, onComplete }: {
  bookName: string;
  chapter: number;
  groupCode: string;
  assignmentId: number | null;
  userName: string;
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
  const canFinish = condTime && condScrolls && condDepth;

  const handleFinishReading = async () => {
    if (!canFinish) return;
    setCompleting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      if (assignmentId !== null) {
        await fetch(`/api/groups/${groupCode}/assignments/${assignmentId}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, bookName, chapter, timeSpent, scrollCount, scrollDepth }),
        });
      } else {
        await fetch(`/api/groups/${groupCode}/reading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, book: bookName, chapter, timeSpent, scrollPercent: scrollDepth }),
        });
      }
      toast.success(`تم تسجيل قراءة ${bookName} ${chapter} - ${formatTime(timeSpent)}`);
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
      <div ref={containerRef} className="max-h-[60vh] overflow-y-auto rounded-lg border p-4 bg-background" dir="rtl">
        <h3 className="font-display text-xl font-bold text-primary mb-4 text-center">{bookName} - الإصحاح {chapter}</h3>
        <div className="space-y-3">
          {verses.map((v: any) => (
            <p key={v.id} className="text-xl leading-loose font-display">
              <span className="text-primary font-bold ml-1">{v.verse}</span>
              {v.text}
            </p>
          ))}
        </div>
      </div>
      {!canFinish && (
        <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
          {!condTime && <span>اقرأ لمدة {MIN_SECONDS - elapsed} ثانية إضافية · </span>}
          {!condScrolls && <span>مرّر {MIN_SCROLLS - scrollCount} مرة أخرى · </span>}
          {!condDepth && <span>واصل القراءة للأسفل حتى {MIN_DEPTH}%</span>}
        </div>
      )}
      <Button onClick={handleFinishReading} disabled={completing || !canFinish} className="w-full" size="lg" data-testid="button-finish-reading">
        {completing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}
        {canFinish ? 'الانتهاء من القراءة' : 'أكمل القراءة أولاً'}
      </Button>
    </div>
  );
}

function AssignmentSection({ groupCode, isAdmin, memberKey, userName, allBooks }: {
  groupCode: string;
  isAdmin: boolean;
  memberKey: string;
  userName: string;
  allBooks: any[];
}) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportAssignmentId, setReportAssignmentId] = useState<number | null>(null);
  const [readingChapter, setReadingChapter] = useState<{ assignmentId: number; bookName: string; chapter: number } | null>(null);
  const [expandedAssignment, setExpandedAssignment] = useState<number | null>(null);

  const [assignType, setAssignType] = useState<'daily' | 'weekly'>('daily');
  const [assignBook, setAssignBook] = useState('');
  const [assignChaptersStr, setAssignChaptersStr] = useState('');
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

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['assignment-progress', groupCode, expandedAssignment],
    queryFn: async () => {
      if (!expandedAssignment) return null;
      const res = await fetch(`/api/groups/${groupCode}/assignments/${expandedAssignment}/progress`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!expandedAssignment,
  });

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
    if (!assignBook || !assignChaptersStr.trim()) {
      toast.error('اختر السفر وأدخل أرقام الإصحاحات');
      return;
    }
    const chapters = assignChaptersStr.split(/[,،\s]+/).map(s => {
      const trimmed = s.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (isNaN(start) || isNaN(end)) return [];
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      const n = parseInt(trimmed);
      return isNaN(n) ? [] : [n];
    }).reduce((acc: number[], arr: number[]) => acc.concat(arr), []);

    if (chapters.length === 0) {
      toast.error('أدخل أرقام الإصحاحات بشكل صحيح (مثال: 1,2,3 أو 1-5)');
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
          chapters,
          deadline: assignDeadline || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم إضافة القراءة المطلوبة');
      setCreateOpen(false);
      setAssignBook('');
      setAssignChaptersStr('');
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
  };

  const getMyProgress = (assignmentId: number, chapters: number[]) => {
    const mp = progressData?.memberProgress?.[userName];
    if (!mp) return { completed: 0, total: chapters.length };
    return { completed: mp.completed || 0, total: chapters.length };
  };

  const isChapterCompleted = (chapter: number) => {
    const mp = progressData?.memberProgress?.[userName];
    if (!mp) return false;
    return mp.chapters?.[chapter]?.completed || false;
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
          onComplete={handleReadComplete}
        />
      </Card>
    );
  }

  return (
    <>
      {assignments.length > 0 && (
        <div className="mb-6 space-y-4">
          {assignments.map((a: any) => {
            const chapters = (a.chapters as number[]) || [];
            const isExpanded = expandedAssignment === a.id;
            const myProg = isExpanded ? getMyProgress(a.id, chapters) : { completed: 0, total: chapters.length };

            return (
              <Card key={a.id} className="p-5 border-emerald-200 dark:border-emerald-800/30" data-testid={`card-assignment-${a.id}`}>
                <div className="flex items-center justify-between mb-2">
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setReportAssignmentId(a.id); setReportOpen(true); }} data-testid={`button-report-${a.id}`}>
                          <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteAssignment(a.id)} data-testid={`button-delete-assignment-${a.id}`}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedAssignment(isExpanded ? null : a.id)} data-testid={`button-expand-${a.id}`}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
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

                    {myProg.completed >= myProg.total && myProg.total > 0 && (
                      <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-center mb-3">
                        <p className="text-green-600 dark:text-green-400 font-bold text-sm">🎉 مبروك! أنهيت كل القراءات المطلوبة</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {chapters.map((ch: number) => {
                        const done = isChapterCompleted(ch);
                        const chapterData = progressData?.memberProgress?.[userName]?.chapters?.[ch];
                        return (
                          <button
                            key={ch}
                            onClick={() => !done && setReadingChapter({ assignmentId: a.id, bookName: a.bookName, chapter: ch })}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة قراءة مطلوبة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>نوع القراءة</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={assignType === 'daily' ? 'default' : 'outline'} size="sm" onClick={() => setAssignType('daily')} data-testid="button-type-daily">
                  يومية
                </Button>
                <Button variant={assignType === 'weekly' ? 'default' : 'outline'} size="sm" onClick={() => setAssignType('weekly')} data-testid="button-type-weekly">
                  أسبوعية
                </Button>
              </div>
            </div>
            <div>
              <Label>عنوان (اختياري)</Label>
              <Input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="مثال: قراءة يوم الأحد" data-testid="input-assign-title" />
            </div>
            <div>
              <Label>السفر</Label>
              <select
                value={assignBook}
                onChange={e => setAssignBook(e.target.value)}
                className="w-full border rounded-md p-2 bg-background text-foreground"
                data-testid="select-assign-book"
              >
                <option value="">اختر السفر</option>
                {allBooks?.map((b: any) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>الإصحاحات المطلوبة</Label>
              <Input
                value={assignChaptersStr}
                onChange={e => setAssignChaptersStr(e.target.value)}
                placeholder="مثال: 1,2,3 أو 1-5 أو 1,3,5-8"
                data-testid="input-assign-chapters"
              />
              <p className="text-xs text-muted-foreground mt-1">افصل بفاصلة أو استخدم - للنطاق (مثال: 1-5)</p>
            </div>
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
  const [todayBook, setTodayBook] = useState('');
  const [todayChapter, setTodayChapter] = useState('');
  const [challengeTotal, setChallengeTotal] = useState('');
  const [copied, setCopied] = useState(false);
  const [todayReaderOpen, setTodayReaderOpen] = useState(false);

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
      setTodayBook(d.group.todayBook || '');
      setTodayChapter(d.group.todayChapter?.toString() || '');
      setChallengeTotal(d.group.challengeTotal?.toString() || '');
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

  const { data: leaderReport } = useQuery({
    queryKey: ['leader-report', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/leader-report`);
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

  const joinRequests = joinRequestsData?.requests || [];

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
          todayBook: todayBook || null,
          todayChapter: todayChapter ? parseInt(todayChapter) : null,
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
          <Badge variant="outline">الخادم: {group.leaderName}</Badge>
          {isAdminFinal && <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 gap-1"><Shield className="w-3 h-3" /> أدمن</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="p-5" data-testid="card-today-reading">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-foreground">قراءة اليوم</h3>
            </div>
            {group.todayBook ? (
              <div>
                <p className="text-lg font-semibold text-primary mb-3">{group.todayBook} {group.todayChapter}</p>
                <Button size="sm" className="w-full" onClick={() => setTodayReaderOpen(true)} data-testid="button-read-now">اقرأ الآن</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لم يتم تحديد قراءة اليوم بعد</p>
            )}
          </Card>

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

        <AssignmentSection
          groupCode={groupCode}
          isAdmin={isAdminFinal}
          memberKey={memberKey}
          userName={userName}
          allBooks={allBooks || []}
        />

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
          <Card className="p-5" data-testid="card-members">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="font-display font-bold text-foreground">الأعضاء ({members.length})</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {members.map((m: any) => {
                const memberChapters = leaderboard.find((l: any) => l.userName === m.userName)?.chaptersReadCount || 0;
                const badge = getBadge(memberChapters);
                return (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={m.readToday ? 'text-green-500' : 'text-red-400'}>
                        {m.readToday ? '✔' : '❌'}
                      </span>
                      <span className="text-sm font-medium">{m.userName}</span>
                      {m.isAdmin && <Badge variant="secondary" className="text-xs gap-0.5"><Shield className="w-2.5 h-2.5" /> أدمن</Badge>}
                      {m.isMuted && <Badge variant="destructive" className="text-xs">مكتوم</Badge>}
                      {badge && <Badge className={`text-xs ${badge.color}`}><Award className="w-2.5 h-2.5 ml-0.5" />{badge.label}</Badge>}
                    </div>
                    {isAdminFinal && m.userName !== userName && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title={m.isAdmin ? 'إزالة أدمن' : 'تعيين كأدمن'}
                          onClick={() => toggleAdmin(m.userName, !m.isAdmin)}
                          data-testid={`button-toggle-admin-${m.userName}`}
                        >
                          {m.isAdmin ? <ShieldOff className="w-3 h-3 text-amber-500" /> : <Shield className="w-3 h-3 text-indigo-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleMute(m.userName, !m.isMuted)}>
                          <span className="text-xs">{m.isMuted ? '🔊' : '🔇'}</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeMember(m.userName)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

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
              {leaderReport.inactiveMembers.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-600 dark:text-amber-400">أعضاء لم يقرأوا منذ عدة أيام</span>
                  </div>
                  <div className="space-y-1">
                    {leaderReport.inactiveMembers.map((name: string) => (
                      <p key={name} className="text-muted-foreground pr-6">• {name}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex justify-center">
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={leaveGroup} data-testid="button-leave-group">
            <LogOut className="w-4 h-4 ml-2" />
            مغادرة المجموعة
          </Button>
        </div>

        <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إدارة المجموعة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>السفر</Label>
                <select
                  value={todayBook}
                  onChange={e => setTodayBook(e.target.value)}
                  className="w-full border rounded-md p-2 bg-background text-foreground"
                  data-testid="select-today-book"
                >
                  <option value="">اختر السفر</option>
                  {allBooks?.map((b: any) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>الإصحاح</Label>
                <Input type="number" min="1" value={todayChapter} onChange={e => setTodayChapter(e.target.value)} data-testid="input-today-chapter" />
              </div>
              <div>
                <Label>إجمالي تحدي القراءة (عدد الإصحاحات)</Label>
                <Input type="number" min="0" value={challengeTotal} onChange={e => setChallengeTotal(e.target.value)} data-testid="input-challenge-total" />
              </div>
              <Button onClick={updateToday} className="w-full" data-testid="button-save-admin">حفظ التغييرات</Button>
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

        <Dialog open={todayReaderOpen} onOpenChange={setTodayReaderOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>قراءة اليوم - {group.todayBook} {group.todayChapter}</DialogTitle>
            </DialogHeader>
            {group.todayBook && group.todayChapter && (
              <InlineChapterReader
                bookName={group.todayBook}
                chapter={parseInt(group.todayChapter)}
                groupCode={groupCode}
                assignmentId={null}
                userName={userName}
                onComplete={() => { setTodayReaderOpen(false); fetchGroup(); }}
              />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
