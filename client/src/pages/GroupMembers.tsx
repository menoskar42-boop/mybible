import { useState, useMemo } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { Users, Search, Shield, ShieldOff, X, ArrowRight, Award, UserPlus, Loader2, Check, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserGroupEntry } from '@/lib/user-groups';

function getBadge(count: number): { label: string; color: string } | null {
  if (count >= 100) return { label: 'قارئ أمين', color: 'bg-amber-500 text-white' };
  if (count >= 25) return { label: 'قارئ نشيط', color: 'bg-green-500 text-white' };
  if (count >= 5) return { label: 'قارئ مبتدئ', color: 'bg-blue-500 text-white' };
  return null;
}

export default function GroupMembers() {
  const params = useParams<{ groupId: string }>();
  const groupCode = (params.groupId || '').toUpperCase();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const stored = JSON.parse(localStorage.getItem(`group_${groupCode}`) || '{}');
  const userEntry = getUserGroupEntry(groupCode);
  const isAdmin = userEntry?.role === 'admin' || stored.isLeader || false;
  const memberKey = userEntry?.memberKey || stored.memberKey || '';
  const userName = userEntry?.userName || stored.userName || '';

  const [search, setSearch] = useState('');
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminName, setAddAdminName] = useState('');
  const [addAdminPhone, setAddAdminPhone] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminResult, setAddAdminResult] = useState<string | null>(null);

  const [readingsTarget, setReadingsTarget] = useState<string | null>(null);
  const [readingsData, setReadingsData] = useState<{ book: string; chapter: number; date: string }[] | null>(null);
  const [readingsLoading, setReadingsLoading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['group', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard', groupCode],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupCode}/leaderboard`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!groupCode,
  });

  const members: any[] = data?.members || [];
  const leaderboard: any[] = leaderboardData?.leaderboard || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.trim().toLowerCase();
    return members.filter((m: any) => m.userName?.toLowerCase().includes(q));
  }, [members, search]);

  const removeMember = async (memberName: string) => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/members/${encodeURIComponent(memberName)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey: memberKey }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم حذف العضو');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['group', groupCode] });
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
      refetch();
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
      refetch();
    } catch {
      toast.error('فشل تغيير الدور');
    }
  };

  const handleAddAdmin = async () => {
    if (!addAdminName.trim() || !addAdminPhone.trim()) {
      toast.error('اكتب الاسم ورقم الموبايل');
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
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setAddAdminResult(result.memberKey);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'فشل إضافة الأدمن');
    } finally {
      setAddAdminLoading(false);
    }
  };

  const openReadings = async (targetUserName: string) => {
    setReadingsTarget(targetUserName);
    setReadingsData(null);
    setReadingsLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/members/${encodeURIComponent(targetUserName)}/readings?memberKey=${encodeURIComponent(memberKey)}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setReadingsData(d.chapters || []);
    } catch {
      setReadingsData([]);
    } finally {
      setReadingsLoading(false);
    }
  };

  const activeToday = members.filter((m: any) => m.readToday).length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.group) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Card className="p-8 text-center">
          <p className="text-destructive font-bold mb-4">المجموعة غير موجودة</p>
          <Button variant="outline" onClick={() => navigate('/groups')}>العودة</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/group/${groupCode}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">أعضاء المجموعة</h1>
          <p className="text-xs text-muted-foreground">{data.group.name}</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => { setAddAdminResult(null); setAddAdminName(''); setAddAdminPhone(''); setAddAdminOpen(true); }} data-testid="button-add-admin">
            <UserPlus className="w-4 h-4 ml-1" />
            إضافة أدمن
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 mb-4">
        <Card className="flex-1 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الأعضاء</p>
        </Card>
        <Card className="flex-1 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{activeToday}</p>
          <p className="text-xs text-muted-foreground">قرأوا اليوم</p>
        </Card>
        <Card className="flex-1 p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{members.length - activeToday}</p>
          <p className="text-xs text-muted-foreground">لم يقرأوا</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث باسم العضو..."
          className="pr-9"
          data-testid="input-search-members"
        />
      </div>

      {/* Members list */}
      <Card className="divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? 'لا يوجد عضو بهذا الاسم' : 'لا يوجد أعضاء بعد'}
          </div>
        ) : (
          filtered.map((m: any) => {
            const memberChapters = leaderboard.find((l: any) => l.userName === m.userName)?.chaptersReadCount || 0;
            const badge = getBadge(memberChapters);
            return (
              <div key={m.id || m.userName} className="flex items-center justify-between px-4 py-3" data-testid={`member-row-${m.userName}`}>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={`text-base flex-shrink-0 ${m.readToday ? 'text-green-500' : 'text-red-400'}`}>
                    {m.readToday ? '✔' : '❌'}
                  </span>
                  <span className="text-sm font-medium truncate">{m.userName}</span>
                  {m.isAdmin && (
                    <Badge variant="secondary" className="text-xs gap-0.5 flex-shrink-0">
                      <Shield className="w-2.5 h-2.5" /> أدمن
                    </Badge>
                  )}
                  {m.isMuted && <Badge variant="destructive" className="text-xs flex-shrink-0">مكتوم</Badge>}
                  {badge && (
                    <Badge className={`text-xs flex-shrink-0 ${badge.color}`}>
                      <Award className="w-2.5 h-2.5 ml-0.5" />{badge.label}
                    </Badge>
                  )}
                  {memberChapters > 0 && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">{memberChapters} إصحاح</span>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0 mr-1">
                  {(isAdmin || m.userName === userName) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="الإصحاحات المقروءة"
                      onClick={() => openReadings(m.userName)}
                      data-testid={`button-readings-${m.userName}`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </Button>
                  )}
                </div>
                {isAdmin && m.userName !== userName && (
                  <div className="flex gap-1 flex-shrink-0 mr-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={m.isAdmin ? 'إزالة أدمن' : 'تعيين كأدمن'}
                      onClick={() => toggleAdmin(m.userName, !m.isAdmin)}
                      data-testid={`button-toggle-admin-${m.userName}`}
                    >
                      {m.isAdmin
                        ? <ShieldOff className="w-3.5 h-3.5 text-amber-500" />
                        : <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={m.isMuted ? 'إلغاء الكتم' : 'كتم'}
                      onClick={() => toggleMute(m.userName, !m.isMuted)}
                      data-testid={`button-mute-${m.userName}`}
                    >
                      <span className="text-sm">{m.isMuted ? '🔊' : '🔇'}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      title="إزالة العضو"
                      onClick={() => removeMember(m.userName)}
                      data-testid={`button-remove-${m.userName}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>

      {search && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          {filtered.length} من {members.length} عضو
        </p>
      )}

      {/* Readings Dialog */}
      <Dialog open={!!readingsTarget} onOpenChange={(o) => { if (!o) { setReadingsTarget(null); setReadingsData(null); } }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              إصحاحات {readingsTarget} المقروءة
            </DialogTitle>
          </DialogHeader>
          {readingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : readingsData && readingsData.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">لم يقرأ أي إصحاح بعد</p>
          ) : readingsData ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-3">{readingsData.length} إصحاح مقروء</p>
              {readingsData.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-sm">✔</span>
                    <span className="text-sm font-medium">{r.book} — إصحاح {r.chapter}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={(o) => { setAddAdminOpen(o); if (!o) setAddAdminResult(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة أدمن للمجموعة</DialogTitle>
          </DialogHeader>
          {addAdminResult ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-foreground">تم إضافة {addAdminName} كأدمن</p>
              <p className="text-sm text-muted-foreground">مفتاح الدخول:</p>
              <code className="font-mono text-sm font-bold text-primary bg-muted px-3 py-1.5 rounded-lg border block">{addAdminResult}</code>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(addAdminResult); toast.success('تم النسخ'); }}>
                نسخ المفتاح
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-name">الاسم</Label>
                <Input id="admin-name" value={addAdminName} onChange={e => setAddAdminName(e.target.value)} placeholder="اكتب اسم الأدمن الجديد" />
              </div>
              <div>
                <Label htmlFor="admin-phone">رقم الموبايل</Label>
                <Input id="admin-phone" value={addAdminPhone} onChange={e => setAddAdminPhone(e.target.value)} placeholder="01000000000" type="tel" dir="ltr" className="text-left" />
              </div>
              <Button onClick={handleAddAdmin} disabled={addAdminLoading} className="w-full">
                {addAdminLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                إضافة كأدمن
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
