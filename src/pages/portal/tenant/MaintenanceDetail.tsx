import React from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MaintenanceDetailPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6 flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Request Details</h1>
          <p className="text-blue-100 text-sm mt-1">View maintenance request status</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Request details will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceDetailPage;
