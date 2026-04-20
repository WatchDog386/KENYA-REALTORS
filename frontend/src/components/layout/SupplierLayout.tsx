import { ReactNode, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Mail, LogOut, Menu, X, ChevronRight } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
  description: string;
}

const SupplierLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

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

  const fullName =
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.email ||
    'Supplier User';

  return (
    <div className="min-h-screen bg-white text-[#1f2937] selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap');`}</style>

      <div className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#0f325e] bg-gradient-to-r from-[#154279] via-blue-700 to-[#154279] px-4 py-3 shadow-lg lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md border border-white/20 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm font-semibold tracking-tight text-white">SUPPLIER PORTAL</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-white/20"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-80 flex-col border-r border-[#d65a01] bg-[#F96302] text-white shadow-xl transition-all duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-20 items-center border-b border-[#d65a01] bg-white px-6">
          <div className="flex flex-col select-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#154279] leading-none">
              Kenya Realtors
            </span>
            <div className="mt-1 text-[20px] font-black tracking-tight text-[#F96302]">Supplier Workspace</div>
          </div>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-3 flex items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fff1e2]">
            <span>Navigation</span>
            <div className="h-px flex-1 bg-gradient-to-r from-[#ffd2ad] to-transparent" />
          </div>

          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'group block border border-transparent px-4 py-3 transition-all',
                  isActive(item.href)
                    ? 'border-white/30 bg-[#154279] text-white shadow-sm'
                    : 'text-white/90 hover:border-[#ffa866] hover:bg-[#eb5a00]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                    {item.icon}
                    {item.title}
                  </div>
                  <ChevronRight
                    size={14}
                    className={cn(
                      'transition-transform',
                      isActive(item.href) ? 'text-white' : 'text-white/70 group-hover:translate-x-0.5'
                    )}
                  />
                </div>
                <div
                  className={cn(
                    'mt-1 text-[11px]',
                    isActive(item.href) ? 'text-blue-100' : 'text-[#ffe5ce]'
                  )}
                >
                  {item.description}
                </div>
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-[#d65a01] bg-[#F05F01] p-4">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffe5ce]">Logged in as</p>
            <p className="mt-1 text-sm font-semibold text-white">{fullName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 border border-white bg-white py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#154279] transition-all hover:bg-[#154279] hover:text-white"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className={cn('min-h-screen flex flex-col bg-white transition-all duration-300', sidebarOpen ? 'lg:ml-80' : 'lg:ml-0')}>
        <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-[#0f325e] bg-gradient-to-r from-[#154279] via-blue-700 to-[#154279] px-8 shadow-lg lg:flex">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold tracking-tight uppercase text-white">
              Supplier Dashboard
            </h2>
            <div className="text-[11px] font-medium uppercase tracking-wide text-blue-100">
              Procurement and invoice workflow
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/20"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </header>

        <div className="relative z-10 flex-1 overflow-hidden bg-white">
          <div className="h-full w-full overflow-y-auto">{children || <Outlet />}</div>
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default SupplierLayout;
