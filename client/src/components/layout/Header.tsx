import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Crown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isPremium?: boolean;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

const navItems = [
  { href: '/', label: 'الرئيسية' },
  { href: '/bible', label: 'الكتاب المقدس' },
  { href: '/plans', label: 'خطط القراءة' },
  { href: '/emotions', label: 'تعزية روحية' },
  { href: '/kids', label: 'للأطفال' },
  { href: '/highlights', label: 'آياتي' },
];

export function Header({ isPremium = false, onToggleTheme, isDark = false }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
            <img src="/logo.png" alt="الكتاب المقدس رفيقي" className="w-10 h-10 rounded-xl shadow-md object-cover" />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-foreground leading-tight">
                الكتاب المقدس رفيقي
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">قراءة • تعزية • دراسة</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-sm font-medium transition-all',
                    location === item.href
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  data-testid={`nav-${item.href.replace('/', '') || 'home'}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              data-testid="button-search"
            >
              <Search className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {isPremium && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-l from-amber-500/20 to-amber-600/10 rounded-full border border-amber-500/30">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">مشترك</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-background"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-base',
                      location === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${item.href.replace('/', '') || 'home'}`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
