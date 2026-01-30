import { Bell, Search } from 'lucide-react';

const PortalHeader = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md w-96">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search properties, tenants..." 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Property Manager</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
            AU
          </div>
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;