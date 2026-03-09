import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowRight
} from "lucide-react";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
    .font-nunito { font-family: 'Nunito', sans-serif; }
    
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #154279; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }

    /* Sharp layout utilities */
    .sharp-card {
      border-radius: 0px;
      transition: all 0.3s ease;
    }
    .sharp-input {
      border-radius: 0px;
    }
    
    /* Subtle Texture for backgrounds */
    .bg-grid-pattern {
      background-image: 
        linear-gradient(rgba(21, 66, 121, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(21, 66, 121, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
    }
  `}</style>
);

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    category: "general"
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contactChannels = [
    {
      id: "phone",
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our team",
      contact: "+254 (0) 123 456 789",
      actionLabel: null,
      details: "Available 24/7",
    },
    {
      id: "chat",
      icon: MessageSquare,
      title: "Chat Live",
      description: "We're available Sun 7:00pm EST - Friday 7:00pm EST",
      contact: "Chat Widget",
      actionLabel: "Chat Now",
      details: "Available now",
    },
    {
      id: "email",
      icon: Mail,
      title: "Ask a Question",
      description: "Fill out our form and we'll get back to you in 24 hours.",
      contact: "support@realtors.com",
      actionLabel: "Get Started",
      details: "Response within 2 hours",
    },
    {
      id: "location",
      icon: MapPin,
      title: "Visit Us",
      description: "Come see us in person",
      contact: "Nairobi, Kenya",
      actionLabel: "Get Directions",
      details: "Westlands Office",
    }
  ];

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Support Request" },
    { value: "feedback", label: "Feedback" },
    { value: "partnership", label: "Partnership" },
    { value: "complaint", label: "Complaint" }
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email format";
    if (!formData.subject.trim()) return "Subject is required";
    if (!formData.message.trim()) return "Message is required";
    if (formData.message.trim().length < 10) return "Message must be at least 10 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        category: "general"
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <>
      <GlobalStyles />
      <div className="font-nunito w-full bg-white min-h-screen pt-24 md:pt-32 pb-12">
        
        {/* HEADER SECTION - Sharp & Sleek */}
        <motion.div
          className="max-w-6xl mx-auto px-6 md:px-12 mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-300 pb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="h-[2px] w-8 bg-[#F96302]"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#F96302]">Contact Us</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#154279] leading-tight">
                Let's Start a Conversation.
              </h1>
            </div>
            <p className="text-sm md:text-base text-slate-600 max-w-md font-medium text-right md:text-right">
              Our team is ready to assist you. Choose a channel below or send us a message directly.
            </p>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {/* CONTACT CHANNELS - Sharp Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <motion.div
                  key={channel.id}
                  className="relative pt-8 group"
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-slate-100 p-6 pt-12 pb-8 text-center h-full flex flex-col items-center justify-between rounded-sm relative z-0">
                      
                      {/* Floating Icon */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#154279] text-white p-4 rounded-full border-4 border-white shadow-md z-10 group-hover:bg-[#F96302] transition-colors duration-300">
                        <Icon size={28} strokeWidth={1.5} />
                      </div>
                      
                      <div className="mt-4 w-full">
                        <h3 className="font-bold text-[#154279] text-xl mb-3">{channel.title}</h3>
                        
                        {channel.id === 'phone' ? (
                          <div className="mb-4">
                            <p className="text-[#154279] font-bold text-lg hover:text-[#F96302] cursor-pointer transition-colors">
                              {channel.contact}
                            </p>
                          </div>
                        ) : (
                          <div className="mb-6 px-2">
                             <p className="text-slate-600 text-sm leading-relaxed">{channel.description}</p>
                          </div>
                        )}
                      </div>
                      
                      {channel.actionLabel && (
                        <button className="bg-[#154279] text-white px-6 py-2.5 rounded font-bold text-sm hover:bg-[#F96302] transition-colors w-full md:w-auto mt-auto">
                            {channel.actionLabel}
                        </button>
                      )}
                      
                      {channel.id === 'phone' && (
                         <p className="text-sm text-slate-500 mt-auto">{channel.details}</p>
                      )}

                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* MAIN LAYOUT - Sharp Form & Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            
            {/* CONTACT FORM - 8 Columns */}
            <motion.div
              className="lg:col-span-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white border border-gray-200 shadow-xl rounded-xl h-full flex flex-col overflow-hidden">
                <div className="bg-[#154279] px-6 py-6 md:px-8 md:py-8 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Send a Message</h2>
                    <p className="text-xs md:text-sm text-slate-300 mt-1 opacity-80">We typically respond within 24 hours.</p>
                  </div>
                  <Mail className="text-white/20 w-12 h-12" />
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-grow">
                  {/* Success Message */}
                  <AnimatePresence>
                    {submitted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-md"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-green-600" />
                          <span className="text-sm font-bold text-green-800 uppercase tracking-wide">
                            Message Sent Successfully
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md"
                      >
                         <div className="flex items-center gap-3">
                          <AlertCircle size={18} className="text-red-600" />
                          <span className="text-sm font-bold text-red-800 uppercase tracking-wide">{error}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Grid Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-700 font-medium text-sm">Full Name <span className="text-[#F96302]">*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#F96302] focus:ring-4 focus:ring-[#F96302]/10 text-gray-900 transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-700 font-medium text-sm">Email Address <span className="text-[#F96302]">*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#F96302] focus:ring-4 focus:ring-[#F96302]/10 text-gray-900 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-700 font-medium text-sm">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+254 700 000 000"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#F96302] focus:ring-4 focus:ring-[#F96302]/10 text-gray-900 transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-700 font-medium text-sm">Inquiry Type</label>
                      <div className="relative">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#F96302] focus:ring-4 focus:ring-[#F96302]/10 text-gray-900 transition-all appearance-none cursor-pointer"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium text-sm">Subject <span className="text-[#F96302]">*</span></label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Briefly describe your inquiry"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#F96302] focus:ring-4 focus:ring-[#F96302]/10 text-gray-900 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium text-sm">Message <span className="text-[#F96302]">*</span></label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Write your message here..."
                      rows={5}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#F96302] focus:ring-4 focus:ring-[#F96302]/10 text-gray-900 transition-all resize-none placeholder:text-gray-400"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group w-full bg-[#154279] hover:bg-[#0f3260] text-white h-12 text-lg font-semibold shadow-lg shadow-blue-900/20 rounded-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader size={20} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Send Message
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>

            {/* QUICK INFO PANEL - 4 Columns */}
            <motion.div
              className="lg:col-span-4 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Info Card 1 */}
              <div className="bg-white border-l-4 border-[#154279] p-6 shadow-sm sharp-card">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 sharp-card">
                    <Clock size={24} className="text-[#154279]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#154279] text-base uppercase mb-1">Response Time</h3>
                    <p className="text-xs text-slate-500 mb-3">Average waiting times</p>
                    <ul className="space-y-2">
                       <li className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 pb-1">
                         <span className="text-slate-600">Email</span>
                         <span className="font-bold text-[#F96302]">~ 2 Hours</span>
                       </li>
                       <li className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 pb-1">
                         <span className="text-slate-600">Phone</span>
                         <span className="font-bold text-green-600">Immediate</span>
                       </li>
                       <li className="flex justify-between items-center text-sm">
                         <span className="text-slate-600">Chat</span>
                         <span className="font-bold text-green-600">Instant</span>
                       </li>
                    </ul>
                  </div>
                </div>
              </div>

             {/* Info Card 2 */}
              <div className="bg-[#154279] text-white p-6 shadow-sm sharp-card relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Globe size={100} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base uppercase mb-2">Global Reach</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Our digital platforms are available 24/7. Whether you are browsing properties or managing listings, we are always open.
                  </p>
                  <div className="inline-block border border-white/30 px-3 py-1 text-xs font-mono text-[#FCD200]">
                    STATUS: SYSTEMS OPERATIONAL
                  </div>
                </div>
              </div>

              {/* Social Media removed as requested - replaced by global floating WhatsApp button */}
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}
