// src/components/portal/super-admin/SystemSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Bell,
  Lock,
  Users,
  Home,
  DollarSign,
  Mail,
  Calendar,
  Shield,
  Globe,
  Database,
  Server,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HeroBackground } from "@/components/ui/HeroBackground";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SystemSettingsProps {
  onSettingsUpdate?: (settings: any) => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ onSettingsUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Property Management System',
    siteUrl: 'https://property-management.example.com',
    adminEmail: 'admin@example.com',
    supportEmail: 'support@example.com',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    language: 'en'
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    requireTwoFactor: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireMixedCase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    apiKey: 'sk_live_******************************',
    enableAuditLog: true
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newUserRegistration: true,
    newPropertyListing: true,
    paymentReceived: true,
    maintenanceRequest: true,
    approvalRequest: true,
    systemAlerts: true
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'noreply@example.com',
    smtpPassword: '********',
    smtpEncryption: 'tls',
    fromName: 'Property Management System',
    fromEmail: 'noreply@example.com',
    testEmail: ''
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: true,
    stripePublicKey: 'pk_live_******************************',
    stripeSecretKey: 'sk_live_******************************',
    paypalEnabled: false,
    paypalClientId: '',
    currency: 'USD',
    lateFeePercentage: 5,
    gracePeriodDays: 3,
    autoChargeEnabled: true
  });

  // Load settings (simulated)
  useEffect(() => {
    // In a real app, you would fetch these from your backend
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Simulate loading
    toast.info('Loading settings...');
  };

  // Handle save settings
  const handleSaveSettings = async (tab: string) => {
    setIsSaving(true);
    
    try {
      // In a real app, you would save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${tab.charAt(0).toUpperCase() + tab.slice(1)} settings saved successfully`);
      
      if (onSettingsUpdate) {
        onSettingsUpdate({
          general: generalSettings,
          security: securitySettings,
          notifications: notificationSettings,
          email: emailSettings,
          payment: paymentSettings
        });
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Test email configuration
  const testEmailConfig = async () => {
    if (!emailSettings.testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    try {
      // Simulate email test
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Test email sent to ${emailSettings.testEmail}`);
    } catch (error) {
      toast.error('Failed to send test email');
    }
  };

  // Regenerate API key
  const regenerateApiKey = () => {
    if (!confirm('Are you sure you want to regenerate the API key? This will invalidate the current key.')) {
      return;
    }

    const newKey = `sk_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setSecuritySettings({ ...securitySettings, apiKey: newKey });
    toast.success('API key regenerated successfully');
  };

  // Backup settings
  const backupSettings = () => {
    const settings = {
      general: generalSettings,
      security: securitySettings,
      notifications: notificationSettings,
      email: emailSettings,
      payment: paymentSettings,
      backupDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Settings backed up successfully');
  };

  // Restore settings
  const restoreSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // Validate the settings structure
      if (settings.general && settings.security) {
        setGeneralSettings(settings.general);
        setSecuritySettings(settings.security);
        setNotificationSettings(settings.notifications || notificationSettings);
        setEmailSettings(settings.email || emailSettings);
        setPaymentSettings(settings.payment || paymentSettings);
        
        toast.success('Settings restored successfully');
      } else {
        toast.error('Invalid settings file');
      }
    } catch (error) {
      toast.error('Failed to restore settings');
    }
  };

  // Reset to defaults
  const resetToDefaults = (tab: string) => {
    if (!confirm('Are you sure you want to reset settings to defaults?')) {
      return;
    }

    switch (tab) {
      case 'general':
        setGeneralSettings({
          siteName: 'Property Management System',
          siteUrl: 'https://property-management.example.com',
          adminEmail: 'admin@example.com',
          supportEmail: 'support@example.com',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          currency: 'USD',
          language: 'en'
        });
        break;
      case 'security':
        setSecuritySettings({
          requireTwoFactor: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireMixedCase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          apiKey: 'sk_live_******************************',
          enableAuditLog: true
        });
        break;
      case 'notifications':
        setNotificationSettings({
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          newUserRegistration: true,
          newPropertyListing: true,
          paymentReceived: true,
          maintenanceRequest: true,
          approvalRequest: true,
          systemAlerts: true
        });
        break;
    }

    toast.success(`${tab} settings reset to defaults`);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto">
          <div className="space-y-1">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-inner">
                    <Settings className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-blue-100 font-bold tracking-wider text-xs uppercase">Configuration</span>
             </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              System <span className="text-[#F96302]">Settings</span>
            </h1>
            <p className="text-blue-100 text-sm mt-2 font-medium max-w-xl">
              Configure general preferences, security, notifications, and payment gateways.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button
              onClick={backupSettings}
              className="group flex items-center gap-2 bg-white text-[#154279] px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/90 transition-all duration-300 rounded-xl shadow-lg border-2 border-white hover:shadow-xl hover:-translate-y-0.5"
            >
              <Download className="h-3.5 w-3.5" />
              Backup Settings
            </button>
             <div className="relative">
            <input
              id="restore-settings"
              type="file"
              accept=".json"
              className="hidden"
              onChange={restoreSettings}
            />
            <label
              htmlFor="restore-settings"
              className="group flex items-center gap-2 bg-white text-[#154279] px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-all duration-300 rounded-xl shadow-lg border-2 border-white hover:shadow-xl cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Restore
            </label>
          </div>
        </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payment">
            <DollarSign className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-2 border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={generalSettings.siteUrl}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, adminEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={generalSettings.dateFormat}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4 gap-3 border-t border-gray-100">
                <Button variant="outline" onClick={() => resetToDefaults('general')} className="text-gray-700 bg-white hover:bg-gray-50 border-gray-200 rounded-lg font-bold">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => handleSaveSettings('general')} disabled={isSaving} variant="secondary">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-2 border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure authentication and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to user accounts</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireTwoFactor}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireTwoFactor: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Log</Label>
                    <p className="text-sm text-gray-500">Log all system activities for security monitoring</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableAuditLog}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enableAuditLog: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Password Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securitySettings.requireMixedCase}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireMixedCase: checked })}
                    />
                    <Label>Mixed Case Letters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireNumbers: checked })}
                    />
                    <Label>Numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireSpecialChars: checked })}
                    />
                    <Label>Special Characters</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API Key</Label>
                    <p className="text-sm text-gray-500">Used for external integrations</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={regenerateApiKey} className="text-gray-700 bg-white hover:bg-gray-50 border-gray-200 rounded-lg font-bold">
                    <Key className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    value={securitySettings.apiKey}
                    readOnly
                    type={showApiKey ? 'text' : 'password'}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <AlertCircle className="h-4 w-4" />
                  Keep this key secure. Regenerate if compromised.
                </div>
              </div>

              <div className="flex justify-between pt-4 gap-3 border-t border-gray-100">
                <Button variant="outline" onClick={() => resetToDefaults('security')} className="text-gray-700 bg-white hover:bg-gray-50 border-gray-200 rounded-lg font-bold">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => handleSaveSettings('security')} disabled={isSaving} variant="secondary">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-2 border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Send notifications via SMS (requires SMS gateway)</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Send push notifications to mobile apps</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.newUserRegistration}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newUserRegistration: checked })}
                    />
                    <Label>New User Registration</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.newPropertyListing}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newPropertyListing: checked })}
                    />
                    <Label>New Property Listing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.paymentReceived}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, paymentReceived: checked })}
                    />
                    <Label>Payment Received</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.maintenanceRequest}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, maintenanceRequest: checked })}
                    />
                    <Label>Maintenance Request</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.approvalRequest}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, approvalRequest: checked })}
                    />
                    <Label>Approval Request</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemAlerts: checked })}
                    />
                    <Label>System Alerts</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => resetToDefaults('notifications')} className="text-gray-700 bg-white hover:bg-gray-50 border-gray-200 rounded-lg font-bold shadow-sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => handleSaveSettings('notifications')} disabled={isSaving} variant="secondary">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card className="border-2 border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email server and templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpEncryption">Encryption</Label>
                  <Select
                    value={emailSettings.smtpEncryption}
                    onValueChange={(value) => setEmailSettings({ ...emailSettings, smtpEncryption: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="testEmail">Test Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="Enter email to test configuration"
                      value={emailSettings.testEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, testEmail: e.target.value })}
                    />
                  </div>
                  <Button onClick={testEmailConfig} variant="secondary" className="mt-6">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" className="text-gray-700 bg-white hover:bg-gray-50 border-gray-200 rounded-lg font-bold shadow-sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => handleSaveSettings('email')} disabled={isSaving} variant="secondary">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="border-2 border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment gateways and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Stripe Payments</Label>
                    <p className="text-sm text-gray-500">Accept credit card payments via Stripe</p>
                  </div>
                  <Switch
                    checked={paymentSettings.stripeEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, stripeEnabled: checked })}
                  />
                </div>

                {paymentSettings.stripeEnabled && (
                  <div className="space-y-4 pl-6 border-l-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                        <Input
                          id="stripePublicKey"
                          value={paymentSettings.stripePublicKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, stripePublicKey: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                        <Input
                          id="stripeSecretKey"
                          type="password"
                          value={paymentSettings.stripeSecretKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeSecretKey: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable PayPal Payments</Label>
                    <p className="text-sm text-gray-500">Accept payments via PayPal</p>
                  </div>
                  <Switch
                    checked={paymentSettings.paypalEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, paypalEnabled: checked })}
                  />
                </div>

                {paymentSettings.paypalEnabled && (
                  <div className="space-y-2 pl-6 border-l-2">
                    <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                    <Input
                      id="paypalClientId"
                      value={paymentSettings.paypalClientId}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalClientId: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Payment Currency</Label>
                  <Select
                    value={paymentSettings.currency}
                    onValueChange={(value) => setPaymentSettings({ ...paymentSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lateFeePercentage">Late Fee Percentage</Label>
                  <Input
                    id="lateFeePercentage"
                    type="number"
                    value={paymentSettings.lateFeePercentage}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, lateFeePercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Grace Period (days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    value={paymentSettings.gracePeriodDays}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, gracePeriodDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Charge</Label>
                  <p className="text-sm text-gray-500">Automatically charge recurring payments</p>
                </div>
                <Switch
                  checked={paymentSettings.autoChargeEnabled}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, autoChargeEnabled: checked })}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" className="text-gray-700 bg-white hover:bg-gray-50 border-gray-200 rounded-lg font-bold shadow-sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => handleSaveSettings('payment')} disabled={isSaving} variant="secondary">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status */}
      <Card className="border-2 border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Server className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">System Status</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  <span className="text-sm text-gray-500">All systems normal</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Database</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  <span className="text-sm text-gray-500">Last sync: Just now</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium">Security</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Protected</Badge>
                  <span className="text-sm text-gray-500">All checks passed</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
};

export default SystemSettings;