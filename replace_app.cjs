const fs = require('fs');

const appFormContent = \import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnitApplicationForm } from "@/components/UnitApplicationForm";

const GlobalStyles = () => (
  <style>{\\\
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  \\\}</style>
);

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [submissionSuccess, setSubmissionSuccess] = React.useState(false);

  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
        <GlobalStyles />
        <Card className="w-full max-w-md border border-gray-100 shadow-2xl bg-white backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-4">
              <CheckCircle className="w-20 h-20 text-[#F96302]" />
            </motion.div>
            <CardTitle className="text-3xl text-[#154279] font-bold">Success!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-800">Your application has been submitted</p>
              <p className="text-gray-600">Our team will review your application and get back to you shortly.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-[#154279] text-[#154279] hover:bg-blue-50" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-inter">
      <GlobalStyles />
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" className="mb-6 text-[#154279] hover:text-[#F96302] hover:bg-transparent pl-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#F96302]/10 p-3 rounded-xl">
              <FileText className="w-8 h-8 text-[#F96302]" />
            </div>
            <div>
               <h1 className="text-4xl font-bold text-[#154279]">Unit Application</h1>
               <p className="text-lg text-gray-600 mt-1">Tenant's Particulars & Application</p>
            </div>
          </div>
        </motion.div>

        <Card className="shadow-xl border border-gray-200 bg-white overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <UnitApplicationForm onSuccess={() => setSubmissionSuccess(true)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationForm;
\;

fs.writeFileSync('src/pages/ApplicationForm.tsx', appFormContent);
console.log("Updated ApplicationForm!");
