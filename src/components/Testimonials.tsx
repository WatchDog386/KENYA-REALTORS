// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import { motion, useAnimation, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRightIcon,
  Quote,
  Star,
  Building,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [testimonials, setTestimonials] = useState(() => {
    try {
      const saved = localStorage.getItem("testimonials");
      return saved
        ? JSON.parse(saved)
        : [
            {
              quote:
                "JTech AI reduced our estimation time by 70% and improved accuracy by 40%. The AI-powered insights have transformed how we approach project budgeting.",
              name: "Michael Mswali",
              title: "Senior Estimator",
              company: "ConstructCo Ltd",
              rating: 5,
              results: [
                { value: "70%", label: "Time Reduction" },
                { value: "40%", label: "Accuracy Improvement" },
              ],
            },
            {
              quote:
                "The AI-powered insights have transformed how we approach project budgeting. We're now able to bid on more projects with confidence in our cost projections.",
              name: "Sarah Waweru",
              title: "Project Director",
              company: "UrbanBuild Group",
              rating: 5,
              results: [
                { value: "35%", label: "More Projects" },
                { value: "25%", label: "Team Productivity" },
              ],
            },
            {
              quote:
                "An essential tool for any modern construction firm. The ROI was immediate, and our team has embraced the platform wholeheartedly for all our estimation needs.",
              name: "John Kamau",
              title: "CTO",
              company: "Skyline Developments",
              rating: 4,
              results: [
                { value: "90%", label: "ROI in 3 months" },
                { value: "100%", label: "Team Adoption" },
              ],
            },
            {
              quote:
                "We've cut our estimation errors to near zero and significantly improved our profit margins. The automated reporting features alone have saved us hundreds of hours.",
              name: "Amanda Achieng",
              title: "Operations Manager",
              company: "Tower Construction Group",
              rating: 5,
              results: [
                { value: "99%", label: "Accuracy Rate" },
                { value: "18%", label: "Profit Increase" },
              ],
            },
          ];
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      return [];
    }
  });
  const companies = [
    "ConstructCo Ltd",
    "UrbanBuild Group",
    "Skyline Developments",
    "Tower Construction",
    "Prime Builders",
    "Metro Engineering",
    "InfraTech Solutions",
    "Global Constructors",
  ];
  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };
  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };
  useEffect(() => {
    let interval;
    if (autoPlay) {
      interval = setInterval(() => nextTestimonial(), 5000);
    }
    return () => clearInterval(interval);
  }, [autoPlay, activeIndex, testimonials.length]);
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let scrollAmount = 0;
    const step = 1;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const interval = setInterval(() => {
      scrollAmount += step;
      if (scrollAmount >= maxScroll) {
        scrollAmount = 0;
        container.scrollLeft = 0;
      } else {
        container.scrollLeft = scrollAmount;
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);
  const currentTestimonial = testimonials[activeIndex];
  return (
    <section id="testimonials" className="bg-transparent">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-400">
          Hear from industry professionals who have transformed their estimation
          process with our solution.
        </p>

        <div className="max-w-5xl mx-auto relative mb-20 mt-10">
          <button
            onClick={prevTestimonial}
            className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all border bg-white text-gray-600 border-gray-200 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:text-primary"
            aria-label="Previous testimonial"
            disabled={testimonials.length <= 1}
          >
            <ChevronLeft />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all border bg-white text-gray-600 border-gray-200 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:text-primary"
            aria-label="Next testimonial"
            disabled={testimonials.length <= 1}
          >
            <ChevronRightIcon />
          </button>

          <div className="relative h-auto overflow-hidden">
            {testimonials.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className={`rounded-2xl shadow-xl overflow-hidden border`}
                >
                  <div className="rounded-2xl shadow-xl overflow-hidden border bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                      <div className="lg:col-span-2 p-8 md:p-10">
                        <div className="text-blue-600 text-5xl mb-6">
                          <Quote className="opacity-70 dark:text-white text-primary" />
                        </div>
                        <p className="text-xl mb-8 leading-relaxed italic text-gray-800 dark:text-gray-200">
                          "{currentTestimonial.quote}"
                        </p>
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex items-center mb-4 md:mb-0">
                            <div className="bg-gradient-to-br from-blue-600 to-purple-800 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {currentTestimonial.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <h4 className="font-bold text-lg">
                                {currentTestimonial.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {currentTestimonial.title},{" "}
                                {currentTestimonial.company}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`text-xl ${
                                  i < currentTestimonial.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-8 md:p-10 border-t lg:border-t-0 lg:border-l bg-gradient-to-br from-blue-50 to-white border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-6">
                          Key Achievements
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {currentTestimonial.results.map((result) => (
                            <div
                              key={result.label}
                              className="p-4 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                            >
                              <div className="text-3xl font-extrabold mb-1">
                                {result.value}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {result.label}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-sm mb-2 text-gray-600 dark:text-gray-400">
                            Project Type:
                          </div>
                          <div className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            Commercial Tower
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-20 text-xl text-gray-600 dark:text-gray-400">
                No testimonials to display yet. Be the first to share your
                experience!
              </div>
            )}
          </div>

          {testimonials.length > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeIndex
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-current={index === activeIndex}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-center text-xl font-semibold mb-10 text-gray-700 dark:text-gray-300">
            Trusted by industry leaders worldwide
          </h3>
          <div
            ref={scrollRef}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 overflow-hidden"
          >
            {companies.map((company, index) => (
              <div
                key={index}
                className="rounded-xl p-5 flex items-center justify-center h-24 border shadow-sm hover:shadow-md transition-all duration-300 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg border border-gray-400 dark:border-white/80 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    <Building className="text-lg" />
                  </div>
                  <span className="font-medium text-center">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
