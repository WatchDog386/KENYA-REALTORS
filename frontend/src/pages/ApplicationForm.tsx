import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { UnitApplicationForm } from "@/components/UnitApplicationForm";

const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  ` }} />
);

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Success Message Component
  if (submissionSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter"
      >
        <GlobalStyles />
        <Card className="w-full max-w-md border border-gray-100 shadow-2xl bg-white backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <CheckCircle className="w-20 h-20 text-[#F96302]" />
            </motion.div>
            <CardTitle className="text-3xl text-[#154279] font-bold">Success!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-800">
                Your rental application has been submitted
              </p>
              <p className="text-gray-600">
                Thank you for applying! Our property managers will review your application and get back to you shortly.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-white border border-[#154279] text-[#154279] hover:bg-slate-50 hover:text-[#154279]"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
              <Button
                className="flex-1 bg-[#F96302] hover:bg-[#E85D02] text-white"
                onClick={() => setSubmissionSuccess(false)}
              >
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-inter">
      <GlobalStyles />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="mb-6 text-[#154279] hover:text-[#F96302] hover:bg-transparent pl-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div>
               <h1 className="text-4xl font-bold text-[#154279]">Unit Rental Application</h1>
               <p className="text-lg text-gray-600 mt-1">
                Complete and submit your tenant application form below
              </p>
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



