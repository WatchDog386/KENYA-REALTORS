import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "idle">("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Check for email verification token in URL
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      verifyEmail();
    }
  }, []);

  useEffect(() => {
    // Countdown timer for resend button
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyEmail = async () => {
    setStatus("verifying");
    setMessage("Verifying your email...");

    try {
      // Supabase automatically handles the verification when the link is clicked
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw new Error("Email verification failed");
      }

      if (user?.email_confirmed_at) {
        setStatus("success");
        setMessage("Email verified successfully!");
        
        // Update profile email_confirmed status
        await supabase.rpc("create_user_profile", {
          p_user_id: user.id,
          p_email: user.email || "",
          p_first_name: user.user_metadata?.full_name?.split(" ")[0] || "",
          p_last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
          p_phone: user.user_metadata?.phone || null,
          p_role: user.user_metadata?.role || "tenant",
          p_status: "active",
        });

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        setStatus("error");
        setMessage("Email verification could not be completed");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Email verification failed");
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });

      if (error) {
        throw new Error(error.message || "Failed to resend email");
      }

      toast.success("Verification email sent! Check your inbox.");
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-50 via-white to-gray-100 opacity-80 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md mx-auto px-6 text-center"
      >
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          {status === "verifying" && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
              <Loader2 size={64} className="text-blue-600" />
            </motion.div>
          )}
          {status === "success" && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              <CheckCircle size={64} className="text-green-600" />
            </motion.div>
          )}
          {status === "error" && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              <AlertCircle size={64} className="text-red-600" />
            </motion.div>
          )}
          {status === "idle" && (
            <Mail size={64} className="text-slate-400" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {status === "verifying" && "Verifying Email"}
          {status === "success" && "Email Verified!"}
          {status === "error" && "Verification Failed"}
          {status === "idle" && "Verify Your Email"}
        </h1>

        {/* Message */}
        <p className="text-slate-600 mb-8">
          {message || "We've sent a confirmation link to your email. Click the link to verify your account and get started."}
        </p>

        {/* Content based on status */}
        {status === "idle" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Didn't receive the email? Check your spam folder or enter your email to resend.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-600 focus:outline-none"
              />
              <Button
                onClick={handleResendEmail}
                disabled={resendLoading || resendCooldown > 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {resendLoading ? "Sending..." : resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Resend"}
              </Button>
            </div>
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <p className="text-green-600 font-medium mb-6">
              Your email has been verified. You can now log in to your account.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              Go to Login <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-red-600 font-medium mb-6">
              {message}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleResendEmail}
                disabled={resendLoading || resendCooldown > 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {resendLoading ? "Sending..." : resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Resend Email"}
              </Button>
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="flex-1"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}

        {status === "verifying" && (
          <p className="text-slate-500">This may take a few moments...</p>
        )}
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage;
