import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';

const SettingsManagement: React.FC = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D85C2C] to-[#D85C2C]/80 rounded-xl shadow-lg p-6 flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Management</h1>
          <p className="text-orange-100 text-sm mt-1">Manage your account and payment preferences</p>
        </div>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-light text-[#00356B] mb-4 tracking-tight">Account <span className="font-bold">Settings</span></h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              defaultValue="admin@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              defaultValue="Real Estate Management Inc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
              <option>GBP - British Pound</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
        
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{key} Notifications</span>
                <p className="text-sm text-gray-600">
                  Receive {key} notifications for important updates
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  value ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-700 mb-2">Export all data</p>
            <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
              Export Data
            </button>
          </div>
          
          <div>
            <p className="text-gray-700 mb-2">Delete account and all data</p>
            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;