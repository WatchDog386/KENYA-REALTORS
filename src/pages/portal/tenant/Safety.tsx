import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, AlertTriangle, Shield, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface SafetyInfo {
  emergencyContacts: EmergencyContact[];
  safetyTips: string[];
  propertyEmergencyNumber: string;
  landlordEmergencyContact: string;
}

const SafetyPage: React.FC = () => {
  const navigate = useNavigate();
  const [safetyData, setSafetyData] = useState<SafetyInfo>({
    emergencyContacts: [
      {
        id: "1",
        name: "John Smith",
        relationship: "Spouse",
        phone: "+1 (555) 123-4567",
        email: "john@example.com",
      },
      {
        id: "2",
        name: "Jane Doe",
        relationship: "Emergency Contact",
        phone: "+1 (555) 987-6543",
      },
    ],
    safetyTips: [
      "Keep emergency exits clear and accessible",
      "Test smoke detectors monthly",
      "Know the location of circuit breakers and water shut-offs",
      "Have a fire extinguisher easily accessible",
      "Store important documents in a safe place",
      "Report any safety hazards immediately to management",
    ],
    propertyEmergencyNumber: "+1 (555) 911-0000",
    landlordEmergencyContact: "+1 (555) 800-0000",
  });

  // Mock CRUD functions for future implementation
  /*
  const fetchSafetyData = async () => {
    try {
      const response = await fetch(`/api/tenant/safety`);
      const data = await response.json();
      setSafetyData(data);
    } catch (error) {
      console.error("Error fetching safety data:", error);
    }
  };

  const addEmergencyContact = async (newContact: Omit<EmergencyContact, 'id'>) => {
    try {
      const response = await fetch(`/api/tenant/safety/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      const data = await response.json();
      setSafetyData({
        ...safetyData,
        emergencyContacts: [...safetyData.emergencyContacts, data],
      });
    } catch (error) {
      console.error("Error adding emergency contact:", error);
    }
  };

  const updateEmergencyContact = async (id: string, updatedContact: Partial<EmergencyContact>) => {
    try {
      const response = await fetch(`/api/tenant/safety/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContact),
      });
      const data = await response.json();
      setSafetyData({
        ...safetyData,
        emergencyContacts: safetyData.emergencyContacts.map(contact =>
          contact.id === id ? data : contact
        ),
      });
    } catch (error) {
      console.error("Error updating emergency contact:", error);
    }
  };

  const deleteEmergencyContact = async (id: string) => {
    try {
      await fetch(`/api/tenant/safety/contacts/${id}`, {
        method: 'DELETE',
      });
      setSafetyData({
        ...safetyData,
        emergencyContacts: safetyData.emergencyContacts.filter(contact => contact.id !== id),
      });
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
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
            Safety
          </h1>
          <p className="text-sm text-gray-600">Emergency contacts and safety information</p>
        </div>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <div>
              <p className="font-semibold text-red-900">In an Emergency</p>
              <p className="text-sm text-red-700">Call 911 for life-threatening emergencies</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} />
            Property Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Property Emergency Line</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {safetyData.propertyEmergencyNumber}
                </p>
              </div>
              <a
                href={`tel:${safetyData.propertyEmergencyNumber}`}
                className="text-[#00356B] hover:underline font-semibold"
              >
                Call
              </a>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Landlord Emergency Contact</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {safetyData.landlordEmergencyContact}
                </p>
              </div>
              <a
                href={`tel:${safetyData.landlordEmergencyContact}`}
                className="text-[#00356B] hover:underline font-semibold"
              >
                Call
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone size={20} />
            Your Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safetyData.emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {safetyData.emergencyContacts.map((contact) => (
                <div key={contact.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                      <div className="mt-2 space-y-1">
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-[#00356B] hover:underline text-sm font-medium block"
                        >
                          {contact.phone}
                        </a>
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-[#00356B] hover:underline text-sm block"
                          >
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No emergency contacts added yet.</p>
          )}
          <button className="mt-4 text-[#00356B] hover:underline text-sm font-semibold">
            Add Emergency Contact
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Safety Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {safetyData.safetyTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-[#00356B] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-gray-700 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyPage;
