// src/pages/portal/ProfileManagement.tsx
import React from 'react';
import { User } from 'lucide-react';

const ProfileManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6 flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Profile Management</h1>
          <p className="text-blue-100 text-sm mt-1">Manage your personal information and account settings</p>
        </div>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-light text-[#00356B] mb-4 tracking-tight">Personal <span className="font-bold">Information</span></h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="Admin User"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue="admin@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              defaultValue="(123) 456-7890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              defaultValue="Administrator"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
              readOnly
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;