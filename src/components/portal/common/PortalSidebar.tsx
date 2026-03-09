import { Link, useLocation } from 'react-router-dom';
// If you don't have lucide-react, run: npm install lucide-react
import { LayoutDashboard, Building2, Users, FileText, Settings, LogOut } from 'lucide-react';

const PortalSidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/portal/dashboard' },
    { icon: Building2, label: 'Properties', path: '/portal/properties' },
    { icon: Users, label: 'Tenants', path: '/portal/tenants' },
    { icon: FileText, label: 'Maintenance', path: '/portal/maintenance' },
  ];

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-blue-400">RealtorPortal</h2>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path) 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white">
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg mt-2">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default PortalSidebar;