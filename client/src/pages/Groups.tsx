import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, LogIn, Church, Shield, ShieldCheck, ChevronLeft, Plus, LogOut, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'wouter';
import { SEOHead } from '@/components/SEOHead';
import { getUserGroups, migrateOldStorage, type UserGroupEntry } from '@/lib/user-groups';
import { getMinistryUser, clearMinistryUser, isAdmin } from '@/lib/ministry-auth';

export default function Groups() {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!getMinistryUser()) {
      navigate('/ministry-auth');
      return;
    }
    migrateOldStorage();
  }, [navigate]);

  const user = getMinistryUser();
  const groups = getUserGroups();

  const handleLogout = () => {
    clearMinistryUser();
    navigate('/ministry-auth');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <SEOHead />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">متابعة القراءة الروحية</h1>
              {user && <p className="text-sm text-muted-foreground">مرحباً، {user.name}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground" data-testid="button-ministry-logout">
            <LogOut className="w-4 h-4 ml-1" />
            خروج
          </Button>
        </div>

        {groups.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-foreground mb-3">مجموعاتي</h2>
            <div className="space-y-3">
              {groups.map((g: UserGroupEntry) => (
                <Card
                  key={g.groupId}
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-primary/10"
                  onClick={() => navigate(`/group/${g.groupId}`)}
                  data-testid={`card-my-group-${g.groupId}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        {g.churchName && (
                          <p className="text-xs font-semibold text-muted-foreground">{g.churchName}</p>
                        )}
                        <h3 className="font-display font-bold text-foreground">{g.groupName || g.groupId}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {g.role === 'admin' ? (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Shield className="w-3 h-3" />
                              أدمن
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">عضو</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isAdmin() && (
          <div className="mb-6">
            <Link href="/admin">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-red-200 dark:border-red-800/30 bg-gradient-to-l from-red-50 to-white dark:from-red-950/20 dark:to-background" data-testid="card-admin-dashboard">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">لوحة تحكم الأدمن</h3>
                      <p className="text-xs text-muted-foreground">إدارة طلبات الكنائس</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          </div>
        )}

        <Link href="/challenge">
          <Card className="p-5 mb-6 hover:shadow-lg transition-shadow cursor-pointer border-amber-200 dark:border-amber-800/30 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950/20 dark:to-background" data-testid="card-church-challenge">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg">تحدي القراءة بين الكنائس</h3>
                  <p className="text-xs text-muted-foreground">تنافس مع المجموعات الأخرى</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/church">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-amber-200 dark:border-amber-800/30" data-testid="card-browse-churches">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Church className="w-7 h-7 text-white" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">الكنائس</h2>
                <p className="text-sm text-muted-foreground">تصفح الكنائس وانضم لمجموعاتها</p>
              </div>
            </Card>
          </Link>

          <Link href="/groups/join">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-primary/20" data-testid="card-join-group">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <LogIn className="w-7 h-7 text-white" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">الانضمام لمجموعة</h2>
                <p className="text-sm text-muted-foreground">انضم بكود المجموعة</p>
              </div>
            </Card>
          </Link>

          <Link href="/church-request">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-primary/20" data-testid="card-request-church">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">طلب إنشاء صفحة للكنيسة</h2>
                <p className="text-sm text-muted-foreground">سجل كنيستك لإنشاء مجموعات</p>
              </div>
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
