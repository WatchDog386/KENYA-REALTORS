import React, { useState } from "react";
import { motion } from "framer-motion";

export default function CTABanner() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setIsSubscribed(true);
    setEmail("");
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#020816] py-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto h-[460px] w-full max-w-[1920px] overflow-hidden md:h-[300px]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_25%,rgba(28,88,176,0.34)_0%,rgba(4,14,35,0)_42%),linear-gradient(108deg,#03102b_6%,#04153a_49%,#0c2149_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-5 h-64 w-64 rotate-45 bg-[#0e2d63]/40" />
        <div className="pointer-events-none absolute left-8 top-9 h-56 w-56 rotate-45 border border-[#dbe5f8]/75" />
        <div className="pointer-events-none absolute left-20 top-20 h-48 w-48 rotate-45 bg-[#123a78]/28" />

        <div className="relative z-10 grid h-full grid-rows-[56%_44%] md:grid-cols-[54%_46%] md:grid-rows-1">
          <div className="flex items-end px-5 pb-7 sm:px-8 md:items-center md:pb-0 md:pl-32 lg:pl-48 xl:pl-64">
            <div className="w-full max-w-[690px] font-['Inter',system-ui,sans-serif]">
              <h2 className="text-[28px] font-medium tracking-tight text-white mb-6 sm:text-[34px]">
                Sign up for news, tips and more
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="Enter your email address*"
                    className="h-12 w-full min-w-[320px] rounded-lg bg-[#000000] px-5 text-[15px] font-medium text-white outline-none placeholder:text-[#a0aabf] border border-transparent focus:border-[#4a72b2]"
                  />

                  <button
                    type="submit"
                    className="h-12 min-w-[160px] whitespace-nowrap rounded-lg bg-[#ea3533] px-6 text-[15px] font-bold text-white transition-colors hover:bg-[#d12a28]"
                  >
                    Subscribe Now
                  </button>
                </form>
              </div>

              {isSubscribed && (
                <div className="mt-4 flex h-12 w-fit min-w-[280px] items-center gap-3 rounded-lg bg-white px-4 text-[15px] text-[#4d5666]">
                  <svg className="h-[18px] w-[18px] text-[#00a651]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Success!
                </div>
              )}
            </div>
          </div>

          <div className="relative z-20 overflow-hidden bg-white shadow-[0_-30px_60px_rgba(0,0,0,0.5)] md:shadow-[-50px_0_80px_rgba(0,0,0,0.6)]">
            <img
              src="/login.png"
              alt="Kenya Realtors representative"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-auto -translate-x-1/2 -translate-y-1/2 object-contain opacity-95 drop-shadow-[0_18px_28px_rgba(0,0,0,0.25)] md:h-[95%]"
              style={{
                WebkitMaskImage: "radial-gradient(ellipse 74% 72% at 52% 52%, #000 62%, transparent 100%)",
                maskImage: "radial-gradient(ellipse 74% 72% at 52% 52%, #000 62%, transparent 100%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0)_38%,rgba(255,255,255,0.72)_78%,rgba(255,255,255,0.96)_100%)]" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}


