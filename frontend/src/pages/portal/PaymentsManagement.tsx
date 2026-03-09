import React, { useState } from 'react';
import { CreditCard, Bell, Shield, Download, Trash2, Mail, AlertCircle } from 'lucide-react';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PaymentsManagement: React.FC = () => {
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
    <div className="min-h-screen bg-gray-50/50">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Financial Settings</h1>
              <p className="text-lg text-blue-100 max-w-2xl font-light">
                Manage billing information, currency, and account preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Account Settings */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="border-2 border-slate-200 shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                        <CardTitle className="text-[#154279] flex items-center gap-2 text-xl font-bold">
                            <CreditCard className="h-5 w-5" /> Account Details
                        </CardTitle>
                        <CardDescription>Update your business profile and currency settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="email" defaultValue="admin@example.com" className="pl-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company Name</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="company" defaultValue="Real Estate Management Inc." className="pl-10" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <Label htmlFor="currency">Default Currency</Label>
                             <Select defaultValue="usd">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="usd">USD - US Dollar ($)</SelectItem>
                                    <SelectItem value="eur">EUR - Euro (€)</SelectItem>
                                    <SelectItem value="gbp">GBP - British Pound (£)</SelectItem>
                                    <SelectItem value="kes">KES - Kenyan Shilling (KSh)</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        
                        <div className="pt-4 flex justify-end">
                            <Button className="bg-[#154279] hover:bg-[#0f325e]">Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-2 border-red-100 shadow-md rounded-2xl overflow-hidden">
                     <CardHeader className="bg-red-50/50 border-b border-red-100 pb-6">
                        <CardTitle className="text-red-700 flex items-center gap-2 text-lg font-bold">
                            <AlertCircle className="h-5 w-5" /> Danger Zone
                        </CardTitle>
                        <CardDescription className="text-red-600/70">Irreversible actions for your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 border-b border-slate-100 last:border-0">
                            <div>
                                <h4 className="font-semibold text-slate-700">Export All Data</h4>
                                <p className="text-sm text-slate-500">Download a full backup of all your property data.</p>
                            </div>
                            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-600">
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                        </div>
                         <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4">
                            <div>
                                <h4 className="font-semibold text-red-700">Delete Account</h4>
                                <p className="text-sm text-red-600/70">Permanently remove your account and all associated data.</p>
                            </div>
                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Sidebar / Notifications */}
             <div className="space-y-8">
                <Card className="border-2 border-slate-200 shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                        <CardTitle className="text-[#154279] flex items-center gap-2 text-xl font-bold">
                            <Bell className="h-5 w-5" /> Notifications
                        </CardTitle>
                        <CardDescription>Manage how you receive alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                         {Object.entries(notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div>
                                <p className="font-bold text-slate-700 capitalize">{key}</p>
                                <p className="text-xs text-slate-500">
                                  {key === 'email' ? 'Daily digest & alerts' : key === 'sms' ? 'Urgent alerts only' : 'In-app popups'}
                                </p>
                              </div>
                              <Switch 
                                checked={value} 
                                onCheckedChange={() => handleNotificationChange(key as keyof typeof notifications)}
                              />
                            </div>
                          ))}
                    </CardContent>
                </Card>
             </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentsManagement;