import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Droplets,
  Trash2,
  Shield,
  Wrench,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UtilitySettings {
  id?: string;
  water_fee: number;
  electricity_fee: number;
  garbage_fee: number;
  security_fee: number;
  service_fee: number;
  custom_utilities?: Record<string, number>;
}

const SuperAdminUtilities = () => {
  const [settings, setSettings] = useState<UtilitySettings>({
    water_fee: 0,
    electricity_fee: 0,
    garbage_fee: 0,
    security_fee: 0,
    service_fee: 0,
    custom_utilities: {},
  });
  const [newUtilityName, setNewUtilityName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("utility_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          water_fee: Number(data.water_fee) || 0,
          electricity_fee: Number(data.electricity_fee) || 0,
          garbage_fee: Number(data.garbage_fee) || 0,
          security_fee: Number(data.security_fee) || 0,
          service_fee: Number(data.service_fee) || 0,
          custom_utilities: data.custom_utilities || {},
        });
      }
    } catch (err: any) {
      console.error("Error fetching utility settings:", err);
      setError(err.message || "Failed to load utility settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        water_fee: settings.water_fee,
        electricity_fee: settings.electricity_fee,
        garbage_fee: settings.garbage_fee,
        security_fee: settings.security_fee,
        service_fee: settings.service_fee,
        custom_utilities: settings.custom_utilities,
        updated_at: new Date().toISOString(),
      };

      let result;
      
      if (settings.id) {
        result = await supabase
          .from("utility_settings")
          .update(payload)
          .eq("id", settings.id);
      } else {
        result = await supabase
          .from("utility_settings")
          .insert([payload]);
      }

      if (result.error) throw result.error;

      toast.success("Utility settings saved successfully");
      fetchSettings(); // Refresh data
    } catch (err: any) {
      console.error("Error saving utility settings:", err);
      setError(err.message || "Failed to save utility settings");
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UtilitySettings, value: string) => {
    const numValue = parseFloat(value);
    setSettings(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleCustomUtilityChange = (name: string, value: string) => {
    const numValue = parseFloat(value);
    setSettings(prev => ({
      ...prev,
      custom_utilities: {
        ...prev.custom_utilities,
        [name]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  const handleAddCustomUtility = () => {
    if (!newUtilityName.trim()) return;
    
    const safeName = newUtilityName.trim();
    if (settings.custom_utilities && settings.custom_utilities[safeName] !== undefined) {
      toast.error("Utility already exists");
      return;
    }

    setSettings(prev => ({
      ...prev,
      custom_utilities: {
        ...prev.custom_utilities,
        [safeName]: 0
      }
    }));
    setNewUtilityName("");
  };

  const handleRemoveCustomUtility = (name: string) => {
    setSettings(prev => {
      const newCustom = { ...prev.custom_utilities };
      delete newCustom[name];
      return {
        ...prev,
        custom_utilities: newCustom
      };
    });
  };

  const totalFees = 
    settings.water_fee + 
    settings.electricity_fee + 
    settings.garbage_fee + 
    settings.security_fee + 
    settings.service_fee +
    Object.values(settings.custom_utilities || {}).reduce((sum, val) => sum + val, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Billing and Invoicing</h1>
        <p className="text-gray-500 mt-2">
          Manage billing and invoicing fees charged to all tenants.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Fee Configuration
            </CardTitle>
            <CardDescription>
              Set the standard monthly fees for all properties.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="water_fee" className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                Water Rate (per unit in KES)
              </Label>
              <Input
                id="water_fee"
                type="number"
                min="0"
                step="0.01"
                value={settings.water_fee || ""}
                onChange={(e) => handleChange("water_fee", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="electricity_fee" className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Electricity Rate (per unit in KES)
              </Label>
              <Input
                id="electricity_fee"
                type="number"
                min="0"
                step="0.01"
                value={settings.electricity_fee || ""}
                onChange={(e) => handleChange("electricity_fee", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="garbage_fee" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-green-600" />
                Garbage Collection Fee (KES)
              </Label>
              <Input
                id="garbage_fee"
                type="number"
                min="0"
                step="0.01"
                value={settings.garbage_fee || ""}
                onChange={(e) => handleChange("garbage_fee", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="security_fee" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-500" />
                Security Fee (KES)
              </Label>
              <Input
                id="security_fee"
                type="number"
                min="0"
                step="0.01"
                value={settings.security_fee || ""}
                onChange={(e) => handleChange("security_fee", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_fee" className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-500" />
                General Service Fee (KES)
              </Label>
              <Input
                id="service_fee"
                type="number"
                min="0"
                step="0.01"
                value={settings.service_fee || ""}
                onChange={(e) => handleChange("service_fee", e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Custom Utilities */}
            {Object.entries(settings.custom_utilities || {}).map(([name, value]) => (
              <div key={name} className="space-y-2 relative">
                <Label htmlFor={`custom_${name}`} className="flex items-center gap-2 capitalize">
                  <Zap className="h-4 w-4 text-gray-500" />
                  {name.replace(/_/g, ' ')} Fee (KES)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`custom_${name}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={value || ""}
                    onChange={(e) => handleCustomUtilityChange(name, e.target.value)}
                    placeholder="0.00"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleRemoveCustomUtility(name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-100">
              <Label className="mb-2 block">Add Custom Utility</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Internet, Parking"
                  value={newUtilityName}
                  onChange={(e) => setNewUtilityName(e.target.value)}
                />
                <Button onClick={handleAddCustomUtility} type="button" variant="secondary">
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-800">Summary</CardTitle>
              <CardDescription className="text-blue-600">
                This is how it will appear to tenants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Total Utilities & Services</p>
                    <p className="text-sm text-gray-500">Monthly combined fee</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700">
                    KES {totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-medium text-blue-800 uppercase tracking-wider">Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Water</span>
                    <span className="font-medium">KES {settings.water_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Electricity</span>
                    <span className="font-medium">KES {settings.electricity_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Garbage</span>
                    <span className="font-medium">KES {settings.garbage_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security</span>
                    <span className="font-medium">KES {settings.security_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="font-medium">KES {settings.service_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                These fees are applied globally to all tenants in the system.
              </p>
              <p>
                When a tenant views their dashboard, they will only see the summarized total of these fees under "Utilities & Services".
              </p>
              <p>
                Updating these values will immediately reflect on all tenant dashboards.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminUtilities;
