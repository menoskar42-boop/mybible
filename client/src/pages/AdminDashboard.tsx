import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Check, X, Church, MapPin, User, Phone, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { getMinistryUser } from '@/lib/ministry-auth';

interface ChurchRequest {
  id: number;
  name: string;
  governorate: string;
  adminName: string;
  adminPhone: string;
  notes: string | null;
  status: string;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [pending, setPending] = useState<ChurchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const user = getMinistryUser();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/groups');
      return;
    }
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch(`/api/churches/pending?phone=${user?.phone}`);
      if (!res.ok) throw new Error('غير مسموح');
      const data = await res.json();
      setPending(data.churches || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/churches/${id}/approve`, { method: 'PUT' });
      if (!res.ok) throw new Error('فشل الموافقة');
      toast.success('تمت الموافقة على الكنيسة');
      setPending(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/churches/${id}/reject`, { method: 'PUT' });
      if (!res.ok) throw new Error('فشل الرفض');
      toast.success('تم رفض الطلب');
      setPending(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <SEOHead />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">لوحة تحكم الأدمن</h1>
            <p className="text-sm text-muted-foreground">إدارة طلبات الكنائس</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : pending.length === 0 ? (
          <Card className="p-8 text-center">
            <Church className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-lg font-bold text-foreground mb-1">لا توجد طلبات معلقة</p>
            <p className="text-sm text-muted-foreground">جميع الطلبات تمت مراجعتها</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg font-bold text-foreground">طلبات معلقة</h2>
              <Badge variant="destructive" className="text-sm">{pending.length}</Badge>
            </div>

            {pending.map(church => (
              <Card key={church.id} className="p-5 border-amber-200 dark:border-amber-800/30" data-testid={`card-pending-church-${church.id}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Church className="w-5 h-5 text-amber-600" />
                      <h3 className="font-display font-bold text-lg text-foreground">{church.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">معلق</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{church.governorate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4 shrink-0" />
                      <span>{church.adminName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span dir="ltr">{church.adminPhone}</span>
                    </div>
                    {church.notes && (
                      <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                        <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{church.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2 border-t">
                    <Button
                      onClick={() => handleApprove(church.id)}
                      disabled={processing === church.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid={`button-approve-${church.id}`}
                    >
                      <Check className="w-4 h-4 ml-1" />
                      قبول
                    </Button>
                    <Button
                      onClick={() => handleReject(church.id)}
                      disabled={processing === church.id}
                      variant="destructive"
                      className="flex-1"
                      data-testid={`button-reject-${church.id}`}
                    >
                      <X className="w-4 h-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
