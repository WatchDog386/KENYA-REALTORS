import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
    .font-poppins { font-family: 'Poppins', sans-serif; }
    .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  `}</style>
);

interface Testimonial {
  id: string | number;
  headline: string;
  quote: string;
  name: string;
  location: string;
  role: string;
  rating: number;
  impact: number;
}

interface DisplayReview extends Testimonial {
  company: string;
  image: string;
}

const CARD_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1400&auto=format&fit=crop",
];

const COMPANY_POOL = [
  "JTech AI Ltd",
  "UrbanBuild Group",
  "BuildPro Inc",
  "Skyline Habitat",
  "PrimeStone Homes",
  "MetroEdge Developers",
];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    headline: "Fast Estimation Gains",
    quote:
      "JTech AI reduced our estimation time by 70% and improved accuracy by 40%. The AI-powered insights have transformed how we approach project budgeting.",
    name: "Michael Johnson",
    location: "Nairobi",
    role: "Estimator",
    rating: 5,
    impact: 98,
  },
  {
    id: 2,
    headline: "Better Project Confidence",
    quote:
      "We're now able to bid on more projects with confidence. The platform's ability to learn from past data has been a game changer for our margins.",
    name: "Sarah Williams",
    location: "Mombasa",
    role: "Project Director",
    rating: 5,
    impact: 96,
  },
  {
    id: 3,
    headline: "Less Admin, More Delivery",
    quote:
      "The automated BOQ generation has saved my team countless hours. We can finally focus on project delivery rather than administrative paperwork.",
    name: "David Chen",
    location: "Nakuru",
    role: "Operations Lead",
    rating: 5,
    impact: 97,
  },
  {
    id: 4,
    headline: "Reliable Communication",
    quote:
      "Progress updates are clear and timely, and handovers are smoother than ever. Everyone stays aligned across teams.",
    name: "Amina Otieno",
    location: "Eldoret",
    role: "Construction Manager",
    rating: 5,
    impact: 95,
  },
  {
    id: 5,
    headline: "Workflow Visibility",
    quote:
      "From quote to closeout, every stage is visible. The dashboard gives us strong control over decisions and timelines.",
    name: "Peter Mwangi",
    location: "Kiambu",
    role: "Site Supervisor",
    rating: 4,
    impact: 92,
  },
  {
    id: 6,
    headline: "Scaled Without Hiring",
    quote:
      "We doubled our active unit count without increasing admin headcount. The platform keeps operations lean and responsive.",
    name: "Grace Njeri",
    location: "Kisumu",
    role: "Portfolio Manager",
    rating: 5,
    impact: 99,
  },
];

export default function TestimonialsSleek() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState(0);

  const cardsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(testimonials.length / cardsPerPage));

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setTestimonials(data);
        } else {
          setTestimonials(FALLBACK_TESTIMONIALS);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        setTestimonials(FALLBACK_TESTIMONIALS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (activePage > totalPages - 1) {
      setActivePage(0);
    }
  }, [activePage, totalPages]);

  useEffect(() => {
    if (totalPages <= 1) return;

    const timer = window.setInterval(() => {
      setActivePage((prev) => (prev + 1) % totalPages);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [totalPages]);

  const displayedReviews = useMemo<DisplayReview[]>(() => {
    const pageSlice = testimonials.slice(activePage * cardsPerPage, activePage * cardsPerPage + cardsPerPage);

    return pageSlice.map((item, idx) => {
      const absoluteIndex = activePage * cardsPerPage + idx;
      const poolIndex = absoluteIndex % CARD_IMAGE_POOL.length;

      return {
        ...item,
        image: CARD_IMAGE_POOL[poolIndex],
        company: COMPANY_POOL[poolIndex],
      };
    });
  }, [activePage, testimonials]);

  return (
    <section id="testimonials" className="relative overflow-hidden py-16 md:py-20 bg-[#0b1020]">
      <GlobalStyles />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(250,107,87,0.18),transparent_42%),radial-gradient(circle_at_84%_10%,rgba(21,66,121,0.34),transparent_50%),linear-gradient(120deg,#0b1020_20%,#131a2d_58%,#0f1425_100%)]" />
        <div
          className="absolute inset-0 opacity-22"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(249,99,2,0.15) 0px, rgba(249,99,2,0.15) 1px, transparent 1px, transparent 240px)",
          }}
        />
      </div>

      <div className="relative z-10 w-full px-4 md:px-[4cm]">
        <h2 className="font-poppins text-center text-[2rem] font-semibold tracking-[-0.025em] text-white md:text-[3.15rem] leading-[1.06]">
          What Our Clients Say
        </h2>

        <div className="mt-10 min-h-[500px] md:min-h-[515px]">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[18px]">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="overflow-hidden rounded-sm border border-white/5 bg-white/[0.03]">
                  <div className="h-[224px] animate-pulse bg-white/10" />
                  <div className="space-y-4 px-0 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                    <div className="h-11 w-52 animate-pulse rounded bg-white/10" />
                    <div className="h-16 animate-pulse rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[18px]"
              >
                {displayedReviews.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[2px]"
                  >
                    <div className="relative h-[224px] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,25,40,0.18)_0%,rgba(41,34,51,0.23)_56%,rgba(20,15,30,0.48)_100%)]" />
                    </div>

                    <div className="pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <p className="font-jakarta text-[1.02rem] font-medium text-[#ff6b57]">{item.company}</p>
                        <span className="h-[2px] w-[58px] bg-[#ff6b57]" />
                      </div>

                      <h3 className="font-poppins text-[2.6rem] leading-[0.98] tracking-[-0.03em] text-[#ff6550] md:text-[3.05rem]">
                        {item.name}
                      </h3>

                      <p className="font-jakarta mt-3 text-[1.02rem] font-medium leading-relaxed text-white/88 md:pr-2">
                        "{item.quote}"
                      </p>
                    </div>
                  </article>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Show testimonial page ${idx + 1}`}
                onClick={() => setActivePage(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === activePage ? "w-10 bg-[#ff6b57]" : "w-2.5 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}