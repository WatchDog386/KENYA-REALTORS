import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PolishedLeasingModuleProps {
  isOpen: boolean;
  onClose: () => void;
}

const PolishedLeasingModule: React.FC<PolishedLeasingModuleProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    propertyType: '',
    budget: '',
    moveInDate: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        propertyType: '',
        budget: '',
        moveInDate: '',
        message: '',
      });
      onClose();
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Schedule a Property Viewing
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-600">
            Fill out the form below and our leasing specialist will contact you within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Request Submitted!</h3>
            <p className="text-gray-600">
              Thank you for your interest. Our leasing specialist will contact you within 24 hours.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h4 className="mb-4 text-lg font-semibold text-gray-900">Contact Information</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Call Us</p>
                      <p className="text-sm text-gray-600">+254 711 493 222</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Us</p>
                      <p className="text-sm text-gray-600">leasing@realtors.co.ke</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Visit Us</p>
                      <p className="text-sm text-gray-600">Nairobi, Kenya</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <h4 className="mb-3 text-lg font-semibold text-gray-900">Why Choose Us?</h4>
                <ul className="space-y-3">
                  {[
                    '24/7 Property Support',
                    'Verified Listings Only',
                    'Flexible Viewing Times',
                    'No Hidden Fees',
                    'Professional Leasing Agents',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+254 711 000 000"
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="propertyType" className="mb-1 block text-sm font-medium text-gray-700">
                      Property Type
                    </label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select Type</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="budget" className="mb-1 block text-sm font-medium text-gray-700">
                      Budget (KSh)
                    </label>
                    <Input
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="50,000"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="moveInDate" className="mb-1 block text-sm font-medium text-gray-700">
                    Preferred Move-in Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="moveInDate"
                      name="moveInDate"
                      type="date"
                      value={formData.moveInDate}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Any specific requirements or questions..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0056A6] hover:bg-[#004080]"
              >
                {isSubmitting ? 'Submitting...' : 'Schedule Viewing'}
              </Button>

              <p className="text-xs text-gray-500">
                By submitting this form, you agree to our Privacy Policy and Terms of Service.
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PolishedLeasingModule;