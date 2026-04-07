import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { UnitApplicationForm } from "@/components/UnitApplicationForm";

const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    .font-admin { font-family: 'Poppins', 'Segoe UI', sans-serif; }
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
        className="min-h-screen bg-[#d7dce1] flex items-center justify-center p-4 md:p-6 font-admin"
      >
        <GlobalStyles />
        <Card className="w-full max-w-md border border-[#bcc3cd] bg-[#eef1f4] rounded-none shadow-none">
          <CardHeader className="text-center pb-3 border-b border-[#bcc3cd]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <CheckCircle className="w-20 h-20 text-[#F96302]" />
            </motion.div>
            <CardTitle className="text-3xl text-[#1f2937] font-bold">Success!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-[#1f2937]">
                Your rental application has been submitted
              </p>
              <p className="text-[#5f6b7c] text-sm">
                Thank you for applying. Your onboarding was processed automatically.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 h-10 rounded-none border border-[#b6bec8] bg-white text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
              <Button
                className="flex-1 h-10 rounded-none border border-[#d96d26] bg-[#F96302] text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#e15802]"
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
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-admin text-[#243041]">
      <GlobalStyles />
      <div className="mx-auto max-w-[1500px] space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#bcc3cd] bg-[#eef1f4]"
        >
          <div className="border-b border-[#bcc3cd] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#5d6c7c]">
            Tenant Application
          </div>
          <div className="p-3">
            <Button
              variant="outline"
              className="mb-3 h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">Unit Rental Application</h1>
                <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                  Complete and submit your tenant application form below.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className="border-b border-[#bcc3cd] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#5d6c7c]">
            Application Details
          </div>
          <div className="p-3 md:p-4">
            <UnitApplicationForm onSuccess={() => setSubmissionSuccess(true)} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ApplicationForm;



