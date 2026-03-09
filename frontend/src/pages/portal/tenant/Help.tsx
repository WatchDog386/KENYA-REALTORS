import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "1",
      category: "Payments",
      question: "How do I pay my rent?",
      answer:
        "You can pay your rent through the portal by navigating to the Payments section. We accept credit cards, debit cards, and bank transfers. Payment is due on the 1st of each month.",
    },
    {
      id: "2",
      category: "Payments",
      question: "Can I set up automatic rent payments?",
      answer:
        "Yes, you can set up automatic recurring payments. Go to Payment Settings and select your preferred payment method and frequency.",
    },
    {
      id: "3",
      category: "Maintenance",
      question: "How do I request maintenance?",
      answer:
        "Click on the Maintenance section in your portal and submit a new request. Describe the issue and provide any relevant details. Our team will contact you within 24 hours.",
    },
    {
      id: "4",
      category: "Maintenance",
      question: "What should I do in case of an emergency?",
      answer:
        "For emergencies, call the emergency number provided in your Safety section. Do not wait for a scheduled maintenance request.",
    },
    {
      id: "5",
      category: "Account",
      question: "How do I update my profile information?",
      answer:
        "Navigate to the Profile section to update your personal information, contact details, and preferences.",
    },
    {
      id: "6",
      category: "Account",
      question: "How can I reset my password?",
      answer:
        "Click the 'Forgot Password' link on the login page. You'll receive an email with instructions to reset your password.",
    },
    {
      id: "7",
      category: "Documents",
      question: "Where can I download my lease agreement?",
      answer:
        "All your documents, including your lease agreement and payment receipts, can be found in the Documents section.",
    },
    {
      id: "8",
      category: "Support",
      question: "How do I contact support?",
      answer:
        "You can reach our support team via the Support section in the portal. We're available 24/7 for emergencies and during business hours for general inquiries.",
    },
  ]);

  // Mock CRUD functions for future implementation
  /*
  const fetchFAQs = async () => {
    try {
      const response = await fetch(`/api/help/faqs`);
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    }
  };

  const createFAQ = async (newFAQ: Omit<FAQ, 'id'>) => {
    try {
      const response = await fetch(`/api/help/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFAQ),
      });
      const data = await response.json();
      setFaqs([...faqs, data]);
    } catch (error) {
      console.error("Error creating FAQ:", error);
    }
  };

  const updateFAQ = async (id: string, updatedFAQ: Partial<FAQ>) => {
    try {
      const response = await fetch(`/api/help/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFAQ),
      });
      const data = await response.json();
      setFaqs(faqs.map(faq => faq.id === id ? data : faq));
    } catch (error) {
      console.error("Error updating FAQ:", error);
    }
  };

  const deleteFAQ = async (id: string) => {
    try {
      await fetch(`/api/help/faqs/${id}`, {
        method: 'DELETE',
      });
      setFaqs(faqs.filter(faq => faq.id !== id));
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };
  */

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/tenant")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            Help & Support
          </h1>
          <p className="text-sm text-gray-600">FAQs and support guides</p>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h2 className="text-lg font-semibold text-[#00356B] mb-3">{category}</h2>
          <div className="space-y-2">
            {faqs
              .filter((faq) => faq.category === category)
              .map((faq) => (
                <Card key={faq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === faq.id ? null : faq.id)
                      }
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle size={18} className="text-[#00356B] flex-shrink-0" />
                        <p className="font-medium text-gray-800">{faq.question}</p>
                      </div>
                      {expandedId === faq.id ? (
                        <ChevronUp size={20} className="text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                      )}
                    </button>

                    {expandedId === faq.id && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-gray-700 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Can't Find What You're Looking For?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Our support team is here to help! Reach out to us with any questions.
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600 font-medium">Email</p>
              <a
                href="mailto:support@aydenhomes.com"
                className="text-[#00356B] hover:underline font-semibold text-sm"
              >
                support@aydenhomes.com
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Phone</p>
              <a
                href="tel:+1234567890"
                className="text-[#00356B] hover:underline font-semibold text-sm"
              >
                (123) 456-7890
              </a>
            </div>
            <p className="text-xs text-gray-500">Available 24/7 for emergencies</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;
