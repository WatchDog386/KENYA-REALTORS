import { ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Mail, LogOut, Menu } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
  description: string;
}

const SupplierLayout = ({ children }: { children?: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/portal/supplier',
      icon: <LayoutDashboard size={18} />,
      description: 'LPO, invoice, and payment overview',
    },
    {
      title: 'Messages',
      href: '/portal/supplier/messages',
      icon: <Mail size={18} />,
      description: 'Internal communication',
    },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
          <div className="mb-6 rounded-xl bg-[#154279] px-4 py-3 text-white">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-100">Portal</div>
            <div className="text-lg font-bold">Supplier Workspace</div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'block rounded-xl border px-3 py-3 transition-colors',
                  isActive(item.href)
                    ? 'border-[#154279] bg-[#154279] text-white'
                    : 'border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white'
                )}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {item.icon}
                  {item.title}
                </div>
                <div className={cn('mt-1 text-xs', isActive(item.href) ? 'text-blue-100' : 'text-slate-500')}>
                  {item.description}
                </div>
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Menu className="h-4 w-4 md:hidden" />
                <span className="text-sm font-semibold uppercase tracking-widest">Supplier Portal</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </header>

          <div className="p-2 md:p-4">{children || <Outlet />}</div>
        </main>
      </div>
    </div>
  );
};

export default SupplierLayout;
