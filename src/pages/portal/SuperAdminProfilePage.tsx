// src/pages/portal/SuperAdminProfilePage.tsx
import React from "react";
import { Shield } from "lucide-react";
import SuperAdminProfile from "@/components/portal/super-admin/SuperAdminProfile";

const SuperAdminProfilePage = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-[#00356B] p-3 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#00356B]">Admin Profile</h1>
          <p className="text-gray-600 text-sm mt-1">Manage your system administrator account</p>
        </div>
      </div>
      <SuperAdminProfile />
    </div>
  );
};

export default SuperAdminProfilePage;
