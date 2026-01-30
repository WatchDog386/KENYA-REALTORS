import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  DollarSign, 
  Users, 
  Building, 
  AlertCircle,
  Calendar,
  TrendingUp,
  LayoutDashboard // Added for the brand logo
} from 'lucide-react';

interface AdminDashboardProps {
  // You can add props here if needed
}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const navigate = useNavigate();

  // Dashboard stats data
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231',
      change: '+20.1%',
      icon: <DollarSign className="h-6 w-6" />,
      color: 'bg-green-500',
    },
    {
      title: 'Active Tenants',
      value: '2,350',
      change: '+180',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Properties',
      value: '1,234',
      change: '+19',
      icon: <Building className="h-6 w-6" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Requests',
      value: '12',
      change: '-2',
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'bg-yellow-500',
    },
  ];

  // Recent properties data
  const recentProperties = [
    {
      id: 1,
      name: 'Sunset Villa',
      address: '123 Main St, San Francisco',
      rent: '$2,500',
      status: 'Occupied',
      tenant: 'John Doe',
    },
    {
      id: 2,
      name: 'Urban Loft',
      address: '456 Oak Ave, New York',
      rent: '$3,200',
      status: 'Vacant',
      tenant: 'Available',
    },
    {
      id: 3,
      name: 'Garden Apartment',
      address: '789 Pine Rd, Seattle',
      rent: '$1,800',
      status: 'Maintenance',
      tenant: 'Bob Johnson',
    },
    {
      id: 4,
      name: 'Lakeside Cottage',
      address: '101 Lakeview Dr, Chicago',
      rent: '$2,100',
      status: 'Occupied',
      tenant: 'Alice Brown',
    },
    {
      id: 5,
      name: 'City Center',
      address: '202 Downtown Blvd, Miami',
      rent: '$4,500',
      status: 'Occupied',
      tenant: 'Michael Wilson',
    },
  ];

  // Recent activity data
  const recentActivity = [
    { user: 'John Doe', action: 'Paid rent', time: '2 hours ago' },
    { user: 'Jane Smith', action: 'Submitted maintenance request', time: '4 hours ago' },
    { user: 'Bob Johnson', action: 'Signed new lease', time: '1 day ago' },
    { user: 'Alice Brown', action: 'Requested lease renewal', time: '2 days ago' },
    { user: 'Michael Wilson', action: 'Reported issue', time: '3 days ago' },
  ];

  const handleViewProperties = () => {
    navigate('/portal/properties');
  };

  const handleViewLeases = () => {
    navigate('/portal/leases');
  };

  const handleViewPayments = () => {
    navigate('/portal/payments');
  };

  const handleEditProperty = (propertyId: number) => {
    navigate(`/portal/properties/edit/${propertyId}`);
  };

  const handleDeleteProperty = (propertyId: number) => {
    if (confirm('Are you sure you want to delete this property?')) {
      console.log('Delete property:', propertyId);
      // Call API to delete
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Brand Logic */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-blue-600 p-3 rounded-lg shadow-sm">
          <LayoutDashboard className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold mt-2 text-gray-900">{stat.value}</p>
                <p className="text-sm mt-1">
                  <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">{stat.change}</span>{' '}
                  <span className="text-gray-500 ml-1">from last month</span>
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-sm`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <div className="h-6 w-1 bg-blue-600 rounded-full mr-3"></div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={handleViewProperties}
            className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
          >
            <Building className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">Manage Properties</p>
            <p className="text-sm text-gray-600">View and edit properties</p>
          </button>
          <button
            onClick={handleViewLeases}
            className="p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all text-left group"
          >
            <Calendar className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">Manage Leases</p>
            <p className="text-sm text-gray-600">View and edit leases</p>
          </button>
          <button
            onClick={handleViewPayments}
            className="p-4 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all text-left group"
          >
            <DollarSign className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">View Payments</p>
            <p className="text-sm text-gray-600">Track rent payments</p>
          </button>
          <button
            onClick={() => navigate('/portal/settings')}
            className="p-4 border border-gray-200 rounded-xl hover:bg-yellow-50 hover:border-yellow-200 transition-all text-left group"
          >
            <AlertCircle className="h-6 w-6 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">System Settings</p>
            <p className="text-sm text-gray-600">Configure portal settings</p>
          </button>
        </div>
      </div>

      {/* Recent Properties and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Properties */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Properties</h3>
            <button
              onClick={handleViewProperties}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{property.name}</p>
                        <p className="text-sm text-gray-500">{property.address}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{property.rent}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        property.status === 'Occupied' 
                          ? 'bg-green-100 text-green-800'
                          : property.status === 'Vacant'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditProperty(property.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Chart (Placeholder) */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-gray-500 font-medium">Revenue chart visualization</p>
            <p className="text-sm text-gray-400 mt-2">Current Monthly: $45,231 (+20.1%)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;