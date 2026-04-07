import React from "react";
import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section className="relative w-full overflow-hidden bg-[#e9edf2] py-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto grid h-[440px] w-full max-w-[1760px] grid-cols-1 grid-rows-[42%_58%] overflow-hidden md:h-[290px] md:grid-cols-2 md:grid-rows-1"
      >
        <div className="relative h-full overflow-hidden md:order-1">
          <img
            src="/banner.png"
            alt="Kenya Realtors visual"
            className="absolute inset-0 h-full w-full object-cover object-left-top contrast-105 brightness-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_36%,rgba(255,255,255,0.02)_68%,rgba(249,99,2,0.08)_100%)]" />
        </div>

        <div className="relative bg-[#F96302] px-6 py-6 md:order-2 md:px-10 md:py-8 lg:px-12">
          <div className="mx-auto w-full max-w-[640px] font-['Lato',sans-serif]">
            <h2 className="text-[2.15rem] font-bold leading-[1.03] text-black md:text-[3rem]">
              Kenya Realtors helps you find the right home faster.
            </h2>

            <p className="mt-3 text-[1.08rem] md:text-[1.2rem] font-semibold leading-relaxed text-black max-w-[52ch]">
              Discover verified listings, compare neighborhoods, and connect with trusted agents across Nairobi and beyond.
            </p>

            <div className="mt-4">
              <a
                href="/features"
                className="inline-flex h-[44px] items-center rounded-[6px] bg-white px-5 text-[15px] font-extrabold text-black transition-colors hover:bg-slate-100"
              >
                Explore Available Homes
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}


