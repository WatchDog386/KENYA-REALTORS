import { useState, useEffect } from 'react';
import {
  createUserWithRole,
  getUsersByRole,
  getAllActiveUsers,
  searchUsers,
  suspendUser,
  deactivateUser,
  reactivateUser
} from '@/services/superAdminManagementService';
import {
  Plus,
  Search,
  AlertTriangle,
  Eye,
  Pause,
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export const SuperAdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'technician' as const,
  });

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let data;
      if (selectedRole === 'all') {
        data = await getAllActiveUsers();
      } else {
        data = await getUsersByRole(selectedRole as any);
      }
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      loadUsers();
      return;
    }
    setLoading(true);
    try {
      const data = await searchUsers(searchTerm);
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createUserWithRole({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
      });

      if (result.success) {
        alert(`User created successfully! ID: ${result.userId}`);
        setFormData({ email: '', first_name: '', last_name: '', phone: '', role: 'technician' });
        setShowCreateForm(false);
        loadUsers();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error creating user: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSuspendUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to suspend this user?')) {
      const success = await suspendUser(userId);
      if (success) {
        alert('User suspended successfully');
        loadUsers();
      }
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      const success = await deactivateUser(userId);
      if (success) {
        alert('User deactivated successfully');
        loadUsers();
      }
    }
  };

  const handleReactivateUser = async (userId: string) => {
    const success = await reactivateUser(userId);
    if (success) {
      alert('User reactivated successfully');
      loadUsers();
    }
  };

  const filteredUsers = users;

  const getRoleColor = (role: string): string => {
    const colors: { [key: string]: string } = {
      super_admin: 'bg-red-100 text-red-800',
      property_manager: 'bg-blue-100 text-blue-800',
      technician: 'bg-purple-100 text-purple-800',
      proprietor: 'bg-green-100 text-green-800',
      caretaker: 'bg-yellow-100 text-yellow-800',
      accountant: 'bg-emerald-100 text-emerald-800',
      tenant: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-nunito">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] py-10 shadow-lg mb-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                 <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                   Admin Portal
                 </span>
               </div>
               <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                 User <span className="text-[#F96302]">Management</span>
               </h1>
               <p className="text-blue-100 font-medium max-w-xl">
                 Create, manage, and control access for all system users across the platform.
               </p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 bg-[#F96302] text-white px-6 py-3 rounded-xl hover:bg-[#d85502] font-bold uppercase text-[11px] tracking-widest shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'Close Form' : 'Create User'}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 pb-12">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8 border-l-4 border-l-[#F96302]">
            <h2 className="text-xl font-bold text-[#154279] mb-6 tracking-tight">Create New User</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96302] transition-colors bg-slate-50"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96302] transition-colors bg-slate-50"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96302] transition-colors bg-slate-50"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96302] transition-colors bg-slate-50"
                  placeholder="+254 700 000000"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96302] transition-colors bg-slate-50 font-medium text-slate-700"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="property_manager">Property Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="technician">Technician</option>
                  <option value="proprietor">Proprietor</option>
                  <option value="caretaker">Caretaker</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
              <div className="lg:col-span-2 flex gap-4 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#154279] text-white py-3 rounded-xl hover:bg-[#0f325e] font-bold uppercase text-xs tracking-widest transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl hover:bg-slate-200 font-bold uppercase text-xs tracking-widest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96302] bg-slate-50 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold uppercase text-xs tracking-wide"
            >
              Search
            </button>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setSearchTerm('');
              }}
              className="px-6 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96302] bg-white font-medium text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="property_manager">Property Manager</option>
              <option value="accountant">Accountant</option>
              <option value="technician">Technician</option>
              <option value="proprietor">Proprietor</option>
              <option value="caretaker">Caretaker</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="animate-spin text-4xl mb-4 text-[#F96302]">⚙️</div>
            <p className="text-slate-600 font-medium">Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 transition-all duration-300 p-6 flex justify-between items-start group"
              >
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.first_name[0]}
                      {user.last_name[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Created: {new Date(user.created_at).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSuspendUser(user.id)}
                    className="p-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    title="Suspend user"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeactivateUser(user.id)}
                    className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    title="Deactivate user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">User Details</h2>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <UserDetailRow label="Name" value={`${selectedUser.first_name} ${selectedUser.last_name}`} />
              <UserDetailRow label="Email" value={selectedUser.email} />
              <UserDetailRow
                label="Role"
                value={
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.replace('_', ' ')}
                  </span>
                }
              />
              <UserDetailRow
                label="Created"
                value={new Date(selectedUser.created_at).toLocaleDateString()}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800 flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4" />
                Management Actions
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  handleSuspendUser(selectedUser.id);
                  setSelectedUser(null);
                }}
                className="w-full px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Suspend Account
              </button>
              <button
                onClick={() => {
                  handleDeactivateUser(selectedUser.id);
                  setSelectedUser(null);
                }}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Deactivate Account
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserDetailRow = ({ label, value }: { label: string; value: any }) => (
  <div className="pb-4 border-b">
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <p className="text-gray-900">{value}</p>
  </div>
);

export default SuperAdminUserManagement;
