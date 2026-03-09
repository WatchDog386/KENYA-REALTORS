// src/pages/admin/CreateRealUsers.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  UserPlus,
  Building,
  Home,
} from "lucide-react";

const CreateRealUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"tenant" | "property_manager">(
    "tenant"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tenant form
  const [tenantForm, setTenantForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Property Manager form
  const [managerForm, setManagerForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    date_of_birth: "",
    nationality: "",
    preferred_language: "en",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    id_document_type: "Passport",
    id_document_number: "",
    id_document_expiry: "",
    tax_id: "",
  });

  const handleTenantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTenantForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleManagerInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setManagerForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const createTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (tenantForm.password !== tenantForm.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (tenantForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const result = await userService.createUser({
      email: tenantForm.email,
      full_name: tenantForm.full_name,
      phone: tenantForm.phone,
      role: "tenant",
      password: tenantForm.password,
    });

    if (result.success) {
      setSuccess(`Tenant ${tenantForm.full_name} created successfully!`);
      setTenantForm({
        email: "",
        full_name: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } else {
      setError(`Failed to create tenant: ${result.error}`);
    }

    setLoading(false);
  };

  const createPropertyManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (managerForm.password !== managerForm.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (managerForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const result = await userService.createUser({
      email: managerForm.email,
      full_name: managerForm.full_name,
      phone: managerForm.phone,
      role: "property_manager",
      password: managerForm.password,
      date_of_birth: managerForm.date_of_birth,
      nationality: managerForm.nationality,
      preferred_language: managerForm.preferred_language,
      emergency_contact_name: managerForm.emergency_contact_name,
      emergency_contact_phone: managerForm.emergency_contact_phone,
      emergency_contact_relationship:
        managerForm.emergency_contact_relationship,
      id_document_type: managerForm.id_document_type,
      id_document_number: managerForm.id_document_number,
      id_document_expiry: managerForm.id_document_expiry,
      tax_id: managerForm.tax_id,
    });

    if (result.success) {
      setSuccess(
        `Property Manager ${managerForm.full_name} created successfully!`
      );
      setManagerForm({
        email: "",
        full_name: "",
        phone: "",
        password: "",
        confirmPassword: "",
        date_of_birth: "",
        nationality: "",
        preferred_language: "en",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
        id_document_type: "Passport",
        id_document_number: "",
        id_document_expiry: "",
        tax_id: "",
      });
    } else {
      setError(`Failed to create property manager: ${result.error}`);
    }

    setLoading(false);
  };

  // Check if current user is super admin
  if (!currentUser || currentUser.role !== "super_admin") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Only Super Administrators can access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/portal/super-admin")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            User Creation Portal
          </CardTitle>
          <CardDescription>
            Create new tenants or property managers. Tenants use the old system,
            property managers use the new system.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="tenant" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Create Tenant
          </TabsTrigger>
          <TabsTrigger
            value="property_manager"
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            Create Property Manager
          </TabsTrigger>
        </TabsList>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-600">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600">{success}</span>
          </div>
        )}

        <TabsContent value="tenant">
          <Card>
            <CardHeader>
              <CardTitle>Create New Tenant</CardTitle>
              <CardDescription>
                Tenant accounts use the simplified system with basic
                information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTenant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Full Name *
                    </label>
                    <Input
                      name="full_name"
                      value={tenantForm.full_name}
                      onChange={handleTenantInputChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Email *
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={tenantForm.email}
                      onChange={handleTenantInputChange}
                      required
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Phone
                    </label>
                    <Input
                      name="phone"
                      value={tenantForm.phone}
                      onChange={handleTenantInputChange}
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Password *
                    </label>
                    <Input
                      name="password"
                      type="password"
                      value={tenantForm.password}
                      onChange={handleTenantInputChange}
                      required
                      placeholder="Min. 6 characters"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Confirm Password *
                    </label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={tenantForm.confirmPassword}
                      onChange={handleTenantInputChange}
                      required
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating Tenant..." : "Create Tenant Account"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property_manager">
          <Card>
            <CardHeader>
              <CardTitle>Create New Property Manager</CardTitle>
              <CardDescription>
                Property Manager accounts use the enhanced system with detailed
                information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createPropertyManager} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Full Name *
                      </label>
                      <Input
                        name="full_name"
                        value={managerForm.full_name}
                        onChange={handleManagerInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Email *
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={managerForm.email}
                        onChange={handleManagerInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Phone
                      </label>
                      <Input
                        name="phone"
                        value={managerForm.phone}
                        onChange={handleManagerInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Date of Birth
                      </label>
                      <Input
                        name="date_of_birth"
                        type="date"
                        value={managerForm.date_of_birth}
                        onChange={handleManagerInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Nationality
                      </label>
                      <Input
                        name="nationality"
                        value={managerForm.nationality}
                        onChange={handleManagerInputChange}
                        placeholder="e.g., Kenyan"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Preferred Language
                      </label>
                      <Select
                        value={managerForm.preferred_language}
                        onValueChange={(value) =>
                          setManagerForm((prev) => ({
                            ...prev,
                            preferred_language: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="sw">Swahili</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Emergency Contact Name
                      </label>
                      <Input
                        name="emergency_contact_name"
                        value={managerForm.emergency_contact_name}
                        onChange={handleManagerInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Emergency Contact Phone
                      </label>
                      <Input
                        name="emergency_contact_phone"
                        value={managerForm.emergency_contact_phone}
                        onChange={handleManagerInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Relationship
                      </label>
                      <Input
                        name="emergency_contact_relationship"
                        value={managerForm.emergency_contact_relationship}
                        onChange={handleManagerInputChange}
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        ID Document Type
                      </label>
                      <Select
                        value={managerForm.id_document_type}
                        onValueChange={(value) =>
                          setManagerForm((prev) => ({
                            ...prev,
                            id_document_type: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="National ID">
                            National ID
                          </SelectItem>
                          <SelectItem value="Driver License">
                            Driver License
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        ID Document Number
                      </label>
                      <Input
                        name="id_document_number"
                        value={managerForm.id_document_number}
                        onChange={handleManagerInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        ID Expiry Date
                      </label>
                      <Input
                        name="id_document_expiry"
                        type="date"
                        value={managerForm.id_document_expiry}
                        onChange={handleManagerInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Tax ID
                      </label>
                      <Input
                        name="tax_id"
                        value={managerForm.tax_id}
                        onChange={handleManagerInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Password *
                      </label>
                      <Input
                        name="password"
                        type="password"
                        value={managerForm.password}
                        onChange={handleManagerInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Confirm Password *
                      </label>
                      <Input
                        name="confirmPassword"
                        type="password"
                        value={managerForm.confirmPassword}
                        onChange={handleManagerInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading
                    ? "Creating Property Manager..."
                    : "Create Property Manager Account"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateRealUsers;
