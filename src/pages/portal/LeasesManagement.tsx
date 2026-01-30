import React from 'react';

const LeasesManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Leases Management</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          Create New Lease
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">John Doe</td>
                <td className="px-6 py-4 whitespace-nowrap">Sunset Villa</td>
                <td className="px-6 py-4 whitespace-nowrap">2024-01-01</td>
                <td className="px-6 py-4 whitespace-nowrap">2024-12-31</td>
                <td className="px-6 py-4 whitespace-nowrap">$2,500</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Jane Smith</td>
                <td className="px-6 py-4 whitespace-nowrap">Urban Loft</td>
                <td className="px-6 py-4 whitespace-nowrap">2023-06-01</td>
                <td className="px-6 py-4 whitespace-nowrap">2024-05-31</td>
                <td className="px-6 py-4 whitespace-nowrap">$3,200</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Expiring Soon</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Bob Johnson</td>
                <td className="px-6 py-4 whitespace-nowrap">Garden Apartment</td>
                <td className="px-6 py-4 whitespace-nowrap">2024-03-01</td>
                <td className="px-6 py-4 whitespace-nowrap">2025-02-28</td>
                <td className="px-6 py-4 whitespace-nowrap">$1,800</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Active Leases</p>
            <p className="text-2xl font-bold">8</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Expiring This Month</p>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Overdue Payments</p>
            <p className="text-2xl font-bold">1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeasesManagement;