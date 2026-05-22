import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Users, Clock, Check, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { addUserGroup } from '@/lib/user-groups';
import { getMinistryUser } from '@/lib/ministry-auth';

export default function GroupInvite() {
  const params = useParams<{ code: string }>();
  const groupCode = (params.code || '').toUpperCase();
  const [, navigate] = useLocation();
  const user = getMinistryUser();

  const [groupInfo, setGroupInfo] = useState<{ name: string; churchName?: string; leaderName: string; linkJoinMode: string } | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [infoError, setInfoError] = useState('');

  const [userName, setUserName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'joined'>('idle');

  useEffect(() => {
    if (!groupCode) return;
    fetch(`/api/groups/${groupCode}/invite-info`)
      .then(r => r.json())
      .then(data => {
        if (data.group) setGroupInfo(data.group);
        else setInfoError('المجموعة غير موجودة أو الرابط غير صحيح');
      })
      .catch(() => setInfoError('فشل تحميل بيانات المجموعة'))
      .finally(() => setInfoLoading(false));
  }, [groupCode]);

  const handleJoin = async () => {
    if (!userName.trim()) { toast.error('اكتب اسمك'); return; }
    if (!phone.trim() || phone.trim().length < 10) { toast.error('رقم الموبايل غير صحيح'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/invite-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: userName.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.status === 'already_member') {
        const isAdmin = data.member?.isAdmin === true;
        localStorage.setItem(`group_${groupCode}`, JSON.stringify({
          userName: userName.trim(), memberKey: data.member.memberKey,
          isLeader: isAdmin, groupCode,
        }));
        addUserGroup({
          groupId: groupCode, groupName: groupInfo?.name || groupCode,
          churchName: groupInfo?.churchName || '', role: isAdmin ? 'admin' : 'member',
          userName: userName.trim(), memberKey: data.member.memberKey,
        });
        toast.success('أنت عضو بالفعل في هذه المجموعة');
        navigate(`/group/${groupCode}`);
        return;
      }

      if (data.status === 'joined') {
        localStorage.setItem(`group_${groupCode}`, JSON.stringify({
          userName: userName.trim(), memberKey: data.memberKey,
          isLeader: false, groupCode,
        }));
        addUserGroup({
          groupId: groupCode, groupName: groupInfo?.name || groupCode,
          churchName: groupInfo?.churchName || '', role: 'member',
          userName: userName.trim(), memberKey: data.memberKey,
        });
        toast.success('تم الانضمام بنجاح!');
        navigate(`/group/${groupCode}`);
        return;
      }

      setStatus('pending');
    } catch (err: any) {
      toast.error(err.message || 'فشل الانضمام');
    } finally {
      setLoading(false);
    }
  };

  if (infoLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (infoError) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <Card className="p-8 text-center">
          <p className="text-destructive font-bold mb-4">{infoError}</p>
          <Button variant="outline" onClick={() => navigate('/groups')}>العودة</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <SEOHead />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            {groupInfo?.churchName && <p className="text-xs font-semibold text-muted-foreground">{groupInfo.churchName}</p>}
            <h1 className="font-display text-xl font-bold text-foreground">{groupInfo?.name}</h1>
            <p className="text-xs text-muted-foreground">الخادم: {groupInfo?.leaderName}</p>
          </div>
        </div>

        {status === 'pending' ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">تم إرسال طلبك</h2>
            <p className="text-muted-foreground mb-1">طلب انضمامك لـ <span className="font-bold text-foreground">{groupInfo?.name}</span> في انتظار موافقة الخادم</p>
            <p className="text-sm text-muted-foreground mb-6">ستُضاف للمجموعة بعد الموافقة</p>
            <Button variant="outline" onClick={() => navigate('/groups')} data-testid="button-back-to-groups">العودة لمجموعاتي</Button>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="mb-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-center">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                {groupInfo?.linkJoinMode === 'auto'
                  ? 'ستنضم للمجموعة فور الضغط على انضمام'
                  : 'سيتم إرسال طلب انضمام للخادم المسؤول'}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">اسمك *</Label>
                <Input id="username" value={userName} onChange={e => setUserName(e.target.value)}
                  placeholder="اكتب اسمك الثلاثي" data-testid="input-invite-name" />
              </div>
              <div>
                <Label htmlFor="phone">رقم الموبايل *</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="01000000000" type="tel" dir="ltr" className="text-left"
                  data-testid="input-invite-phone" />
                <p className="text-xs text-muted-foreground mt-1">يُستخدم لتسجيل الدخول لاحقاً</p>
              </div>
              <Button onClick={handleJoin} disabled={loading} className="w-full" size="lg" data-testid="button-invite-join">
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}
                {groupInfo?.linkJoinMode === 'auto' ? 'انضمام فوري' : 'طلب الانضمام'}
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
