import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Lock, Mail, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsData {
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceAlerts: boolean;
  paymentReminders: boolean;
  leaseUpdates: boolean;
  twoFactorEnabled: boolean;
  email: string;
  phone: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    smsNotifications: false,
    maintenanceAlerts: true,
    paymentReminders: true,
    leaseUpdates: true,
    twoFactorEnabled: false,
    email: "tenant@example.com",
    phone: "+1 (555) 000-0000",
  });

  const handleToggle = (key: keyof SettingsData) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  // Mock CRUD functions for future implementation
  /*
  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/tenant/settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const updateSettings = async (updatedSettings: Partial<SettingsData>) => {
    try {
      const response = await fetch(`/api/tenant/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const deleteSettings = async () => {
    try {
      await fetch(`/api/tenant/settings`, {
        method: 'DELETE',
      });
      // Reset to default
      setSettings({
        emailNotifications: true,
        smsNotifications: false,
        maintenanceAlerts: true,
        paymentReminders: true,
        leaseUpdates: true,
        twoFactorEnabled: false,
        email: "",
        phone: "",
      });
    } catch (error) {
      console.error("Error deleting settings:", error);
    }
  };
  */

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/tenant")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-gray-600">Manage your account preferences</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Email Notifications</p>
                <p className="text-xs text-gray-600">Receive updates via email</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle("emailNotifications")}
              className="w-5 h-5 text-[#00356B] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">SMS Notifications</p>
                <p className="text-xs text-gray-600">Receive text messages</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={() => handleToggle("smsNotifications")}
              className="w-5 h-5 text-[#00356B] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Maintenance Alerts</p>
              <p className="text-xs text-gray-600">Get notified about maintenance</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceAlerts}
              onChange={() => handleToggle("maintenanceAlerts")}
              className="w-5 h-5 text-[#00356B] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Payment Reminders</p>
              <p className="text-xs text-gray-600">Reminders before rent due date</p>
            </div>
            <input
              type="checkbox"
              checked={settings.paymentReminders}
              onChange={() => handleToggle("paymentReminders")}
              className="w-5 h-5 text-[#00356B] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Lease Updates</p>
              <p className="text-xs text-gray-600">Notifications about lease changes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.leaseUpdates}
              onChange={() => handleToggle("leaseUpdates")}
              className="w-5 h-5 text-[#00356B] rounded cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={20} />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Two-Factor Authentication</p>
              <p className="text-xs text-gray-600">Add extra security to your account</p>
            </div>
            <input
              type="checkbox"
              checked={settings.twoFactorEnabled}
              onChange={() => handleToggle("twoFactorEnabled")}
              className="w-5 h-5 text-[#00356B] rounded cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 font-medium">Email Address</p>
            <p className="text-gray-800 mt-1">{settings.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Phone Number</p>
            <p className="text-gray-800 mt-1">{settings.phone}</p>
          </div>
          <button className="text-[#00356B] hover:underline text-sm font-semibold">
            Update Contact Information
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
