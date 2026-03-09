// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userType = (searchParams.get('type') as 'tenant' | 'landlord') || 'tenant';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    role: userType,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
      });
      
      setSuccess('Account created successfully! Redirecting to login...');
      
      setTimeout(() => {
        navigate(`/login?email=${encodeURIComponent(formData.email)}`);
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = err.message || 'Failed to create account. Please try again.';
      
      // Improve user feedback
      if (message.includes('User already registered')) {
        message = 'An account with this email already exists. Please log in instead.';
      } else if (message.includes('invalid email')) {
        message = 'Please enter a valid email address.';
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-8 pt-32 bg-white h-full relative">
      <div className="mb-6 relative z-0">
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-classy text-[#1a1a1a]"
        >
          Create your account
        </motion.h2>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-gray-400 mt-2 font-light"
        >
          Join as a {userType === 'landlord' ? 'property owner' : 'tenant'}
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-0">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <p className="text-green-600 text-xs font-medium">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Full Name */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={18} />
            </div>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              disabled={isLoading}
              className="
                h-12 w-full
                bg-transparent 
                border-0 border-b-[1px] border-gray-200 
                rounded-none 
                pl-8 pr-0 py-2
                text-base text-gray-800 font-light
                placeholder:text-gray-300 placeholder:font-extralight
                focus:border-black focus:border-b-[1.5px]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-500 ease-in-out
                shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
          </div>
        </motion.div>

        {/* Email */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              disabled={isLoading}
              className="
                h-12 w-full
                bg-transparent 
                border-0 border-b-[1px] border-gray-200 
                rounded-none 
                pl-8 pr-0 py-2
                text-base text-gray-800 font-light
                placeholder:text-gray-300 placeholder:font-extralight
                focus:border-black focus:border-b-[1.5px]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-500 ease-in-out
                shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
          </div>
        </motion.div>

        {/* Phone */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone size={18} />
            </div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number (Optional)"
              disabled={isLoading}
              className="
                h-12 w-full
                bg-transparent 
                border-0 border-b-[1px] border-gray-200 
                rounded-none 
                pl-8 pr-0 py-2
                text-base text-gray-800 font-light
                placeholder:text-gray-300 placeholder:font-extralight
                focus:border-black focus:border-b-[1.5px]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-500 ease-in-out
                shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              disabled={isLoading}
              className="
                h-12 w-full
                bg-transparent 
                border-0 border-b-[1px] border-gray-200 
                rounded-none 
                pl-8 pr-0 py-2
                text-base text-gray-800 font-light
                placeholder:text-gray-300 placeholder:font-extralight
                focus:border-black focus:border-b-[1.5px]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-500 ease-in-out
                shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
          </div>
        </motion.div>

        {/* Confirm Password */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
              disabled={isLoading}
              className="
                h-12 w-full
                bg-transparent 
                border-0 border-b-[1px] border-gray-200 
                rounded-none 
                pl-8 pr-0 py-2
                text-base text-gray-800 font-light
                placeholder:text-gray-300 placeholder:font-extralight
                focus:border-black focus:border-b-[1.5px]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-500 ease-in-out
                shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.9 }} 
          className="pt-2"
        >
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full h-12 
              bg-navy hover:bg-[#002855]
              text-white font-medium text-xs 
              tracking-[0.15em] uppercase 
              rounded-full 
              flex items-center justify-center gap-2
              transition-all duration-300 
              shadow-lg shadow-navy/20
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>

          <div className="text-center pt-4">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={isLoading}
                className="text-[#0056A6] hover:underline font-medium disabled:opacity-50"
              >
                Sign in
              </button>
            </p>
          </div>
        </motion.div>
      </form>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="mt-auto mb-6 text-center"
      >
        <p className="text-[9px] text-gray-300 font-medium tracking-widest">REALTORS KENYA</p>
      </motion.div>
    </div>
  );
};

export default RegisterForm;