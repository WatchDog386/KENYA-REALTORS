import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Linkedin,
  Twitter,
  Facebook,
  Globe,
  Plus,
  X,
  ChevronDown
} from "lucide-react";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
    .font-nunito { font-family: 'Nunito', sans-serif; }
    
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }
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
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const contactChannels = [
    {
      id: "phone",
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our team",
      contact: "+254 (0) 123 456 789",
      details: "Available 24/7",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "email",
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      contact: "support@realtors-leasers.com",
      details: "Response within 2 hours",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: "chat",
      icon: MessageSquare,
      title: "Live Chat",
      description: "Instant support online",
      contact: "Chat Widget",
      details: "Available now",
      color: "from-green-500 to-green-600"
    },
    {
      id: "location",
      icon: MapPin,
      title: "Visit Us",
      description: "Come see us in person",
      contact: "Nairobi, Kenya",
      details: "Westlands Office",
      color: "from-purple-500 to-purple-600"
    }
  ];

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Support Request" },
    { value: "feedback", label: "Feedback" },
    { value: "partnership", label: "Partnership" },
    { value: "complaint", label: "Complaint" }
  ];

  const faqData = [
    {
      id: "faq-1",
      question: "What are your business hours?",
      answer: "We operate 24/7 to serve you better. Our customer support team is available round the clock via phone, email, and live chat. During peak hours (8 AM - 6 PM EAT), you'll get faster responses."
    },
    {
      id: "faq-2",
      question: "How quickly will I receive a response?",
      answer: "Email inquiries are answered within 2 hours. Phone calls are answered immediately during business hours. Live chat responses are instant. Critical issues get priority response."
    },
    {
      id: "faq-3",
      question: "Do you offer emergency support?",
      answer: "Yes! We have a dedicated emergency hotline for urgent property issues. Use the emergency option in the chat or call our 24/7 support line for immediate assistance."
    },
    {
      id: "faq-4",
      question: "Can I schedule a meeting with management?",
      answer: "Absolutely. You can request a meeting through the contact form by selecting 'Partnership' or 'General Inquiry'. We'll get back to you within 24 hours to schedule."
    },
    {
      id: "faq-5",
      question: "How do I report a maintenance issue?",
      answer: "Tenants can report maintenance through the tenant portal or call our maintenance hotline. Property managers should use the admin dashboard. Emergency issues should be reported immediately by phone."
    }
  ];

  const officeLocations = [
    {
      city: "Nairobi",
      country: "Kenya",
      address: "Westlands, Nairobi",
      phone: "+254 (0) 123 456 789",
      email: "nairobi@realtors-leasers.com",
      hours: "Mon - Fri: 8 AM - 6 PM\nSat - Sun: 10 AM - 4 PM"
    },
    {
      city: "Kampala",
      country: "Uganda",
      address: "Kampala City Center",
      phone: "+256 (0) 123 456 789",
      email: "kampala@realtors-leasers.com",
      hours: "Mon - Fri: 8 AM - 6 PM\nSat - Sun: 10 AM - 4 PM"
    },
    {
      city: "Dar es Salaam",
      country: "Tanzania",
      address: "Dar es Salaam Business District",
      phone: "+255 (0) 123 456 789",
      email: "dar@realtors-leasers.com",
      hours: "Mon - Fri: 8 AM - 6 PM\nSat - Sun: 10 AM - 4 PM"
    }
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
      <div className="font-nunito w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen pt-12 pb-12">
        
        {/* HEADER SECTION */}
        <motion.div
          className="max-w-6xl mx-auto px-6 md:px-12 text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-full mb-4">
            <Mail size={16} className="text-[#F96302]" />
            <span className="text-sm font-bold text-[#F96302]">Get In Touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#154279] mb-4 leading-tight">
            Contact Us
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Have questions? Our dedicated team is here to help. Reach out through any channel that works best for you.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {/* CONTACT CHANNELS */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <motion.div
                  key={channel.id}
                  className="group relative"
                  whileHover={{ y: -8 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${channel.color} rounded-lg blur opacity-0 group-hover:opacity-40 transition-opacity`} />
                  <div className="relative bg-white rounded-lg p-6 border border-slate-200 shadow-md hover:shadow-lg transition-shadow h-full">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${channel.color} flex items-center justify-center text-white mb-4`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{channel.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{channel.description}</p>
                    <p className="text-sm font-semibold text-[#154279] mb-1">{channel.contact}</p>
                    <p className="text-xs text-slate-600">{channel.details}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* MAIN LAYOUT - Form & Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* CONTACT FORM */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#154279] to-[#0f325e] px-8 py-8 text-white">
                  <h2 className="text-2xl font-bold">Send us a Message</h2>
                  <p className="text-slate-200 mt-1">We'll get back to you as soon as possible</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {/* Success Message */}
                  <AnimatePresence>
                    {submitted && (
                      <motion.div
                        className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle size={20} className="text-green-600" />
                        <div>
                          <p className="font-semibold">Thank you for your message!</p>
                          <p className="text-sm">We've received your inquiry and will respond within 2 hours.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <AlertCircle size={20} className="text-red-600" />
                        <p className="font-semibold">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#154279] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#154279] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Phone (Optional)</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+254 700 000 000"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#154279] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Category & Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#154279] focus:border-transparent transition-all appearance-none bg-white"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Subject *</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="How can we help?"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#154279] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#154279] focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">{formData.message.length} characters</p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#154279] to-[#0f325e] hover:from-[#0f325e] hover:to-[#082050] text-white px-6 py-4 rounded-lg font-semibold transition-all inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* QUICK INFO */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Response Time */}
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock size={20} className="text-[#154279]" />
                  </div>
                  <h3 className="font-bold text-slate-800">Response Time</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F96302]" />
                    <span><strong>Email:</strong> 2 hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F96302]" />
                    <span><strong>Phone:</strong> Immediate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F96302]" />
                    <span><strong>Chat:</strong> Instant</span>
                  </li>
                </ul>
              </div>

              {/* Availability */}
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Globe size={20} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">Availability</h3>
                </div>
                <p className="text-sm text-slate-700">
                  We're available <strong>24/7</strong> to assist you with any questions or concerns. Our team is always ready to help!
                </p>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {[
                    { icon: Facebook, color: "from-blue-600 to-blue-700" },
                    { icon: Twitter, color: "from-blue-400 to-blue-500" },
                    { icon: Linkedin, color: "from-blue-600 to-blue-700" }
                  ].map((social, idx) => {
                    const Icon = social.icon;
                    return (
                      <motion.button
                        key={idx}
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${social.color} text-white flex items-center justify-center transition-transform`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon size={18} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* OFFICE LOCATIONS */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#154279] mb-2">Our Offices</h2>
              <p className="text-slate-600">Visit us at any of our regional offices</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {officeLocations.map((office, idx) => (
                <motion.div
                  key={idx}
                  className="bg-white rounded-lg shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow"
                  whileHover={{ y: -4 }}
                >
                  <h3 className="text-lg font-bold text-[#154279] mb-1">{office.city}</h3>
                  <p className="text-sm text-slate-600 mb-4">{office.country}</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-[#F96302] mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-700">{office.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-[#F96302] shrink-0" />
                      <a href={`tel:${office.phone}`} className="text-sm text-[#154279] hover:underline">{office.phone}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-[#F96302] shrink-0" />
                      <a href={`mailto:${office.email}`} className="text-sm text-[#154279] hover:underline">{office.email}</a>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                      <Clock size={16} className="text-[#F96302] mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600 whitespace-pre-line">{office.hours}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ SECTION */}
          <motion.div
            className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="bg-gradient-to-r from-[#154279] to-[#0f325e] px-8 py-8 text-white">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <p className="text-slate-200 mt-1">Quick answers to common questions</p>
            </div>

            <div className="divide-y divide-slate-200">
              {faqData.map((faq) => (
                <motion.div
                  key={faq.id}
                  className="border-l-4 border-l-transparent hover:border-l-[#F96302] transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full text-left px-8 py-5 hover:bg-slate-50 transition-colors flex justify-between items-center"
                  >
                    <span className="font-semibold text-slate-800">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: expandedFaq === faq.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={20} className="text-[#F96302]" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {expandedFaq === faq.id && (
                      <motion.div
                        className="px-8 py-4 bg-slate-50 text-slate-700 text-sm leading-relaxed"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
