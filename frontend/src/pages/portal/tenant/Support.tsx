import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SupportPage: React.FC = () => {
  const navigate = useNavigate();

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
            Support
          </h1>
          <p className="text-sm text-gray-600">Get help with your account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <a
              href="mailto:support@aydenhomes.com"
              className="text-[#00356B] hover:underline font-semibold"
            >
              support@aydenhomes.com
            </a>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <a
              href="tel:+1234567890"
              className="text-[#00356B] hover:underline font-semibold"
            >
              (123) 456-7890
            </a>
          </div>
          <p className="text-sm text-gray-500">Available 24/7 for emergencies</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;
