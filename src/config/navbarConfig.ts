import {
  FaHome,
  FaTools,
  FaList,
  FaTags,
  FaCreditCard,
  FaStar,
  FaHeadset,
  FaSearch,
  FaKey,
  FaCity,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import React from "react";

// Colors Configuration
export const COLORS = {
  primary: "#154279",      // Deep Blue
  secondary: "#F96302",    // Bright Orange
  light: "#F9F1DC",
  dark: "#5C5035",
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
  },
  gold: "#D4AF37",
};

// Navigation Sections Configuration
export const NAVIGATION_SECTIONS = [
  {
    name: "Home",
    id: "",
    icon: FaHome,
    iconSize: 16,
    iconColor: COLORS.primary,
    highlight: false,
  },
  {
    name: "DIY Rental guides",
    id: "how-it-works",
    icon: FaTools,
    iconSize: 16,
    iconColor: COLORS.secondary,
    highlight: false,
  },
  {
    name: "Apartments features",
    id: "features",
    icon: FaList,
    iconSize: 16,
    iconColor: COLORS.primary,
    highlight: false,
  },
  {
    name: "Affordable Prices",
    id: "pricing",
    icon: FaTags,
    iconSize: 18,
    iconColor: COLORS.secondary,
    highlight: true,
  },
  {
    name: "Blog",
    id: "payment-options",
    icon: FaCreditCard,
    iconSize: 18,
    iconColor: COLORS.primary,
    highlight: false,
  },
  {
    name: "Reviews",
    id: "testimonials",
    icon: FaStar,
    iconSize: 16,
    iconColor: COLORS.secondary,
    highlight: false,
  },
  {
    name: "Tenant Support",
    id: "faq",
    icon: FaHeadset,
    iconSize: 16,
    iconColor: COLORS.primary,
    highlight: false,
  },
];

// Quick Actions Configuration (Mobile Menu)
export const QUICK_ACTIONS = [
  {
    label: "Find",
    id: "how-it-works",
    icon: FaSearch,
    iconColor: COLORS.primary,
  },
  {
    label: "Lease",
    id: "features",
    icon: FaKey,
    iconColor: COLORS.secondary,
  },
  {
    label: "List",
    id: "login",
    icon: FaCity,
    iconColor: COLORS.primary,
  },
];

// Top Utility Bar Configuration
export const UTILITY_BAR = {
  location: {
    text: "Nairobi, KE",
    icon: FaMapMarkerAlt,
    enabled: true,
  },
  phone: {
    text: "+254 711 493 222",
    icon: FaPhoneAlt,
    enabled: true,
  },
  buttons: [
    {
      label: "Post a Rental",
      action: "login",
      size: "text-[10px]",
    },
    {
      label: "Pay Rent",
      action: "login",
      size: "text-[10px]",
    },
  ],
};

// Account Dropdown Configuration
export const ACCOUNT_DROPDOWN = {
  title: "Welcome to Kenya Realtors",
  items: [
    {
      id: "signin",
      label: "Sign In",
      description: "Access your account",
      icon: "FaSignInAlt",
      action: "login",
      bgColor: "bg-blue-100",
      textColor: "text-[#154279]",
      hoverBgColor: "group-hover/item:bg-[#154279]",
      hoverTextColor: "group-hover/item:text-white",
    },
    {
      id: "signup",
      label: "Create Account",
      description: "New here? Join us",
      icon: "FaUserPlus",
      action: "register",
      bgColor: "bg-orange-100",
      textColor: "text-[#F96302]",
      hoverBgColor: "group-hover/item:bg-[#F96302]",
      hoverTextColor: "group-hover/item:text-white",
    },
  ],
};

// Mobile Menu Promo Banner Configuration
export const PROMO_BANNER = {
  badge: "PROMO",
  title: "One Month Free",
  description: "On select luxury apartments in Westlands.",
  ctaLabel: "Check Availability",
  ctaAction: "testimonials",
  bgColor: COLORS.primary,
  accentColor: COLORS.secondary,
  badgeColor: "bg-[#F96302]",
  textColor: "text-white",
  buttonBg: "bg-white",
  buttonText: `text-[${COLORS.primary}]`,
};

// Brand Configuration
export const BRAND = {
  countryLabel: "kenya",
  brandName: "realtors",
  countryLabelSize: "text-[11px] md:text-[12px]",
  brandNameSize: "text-[22px] md:text-[26px]",
  dotColor: COLORS.secondary,
  primaryColor: COLORS.primary,
};

// Search Bar Configuration
export const SEARCH_BAR = {
  placeholder: "Search by City, Zip, or Building...",
  buttonText: "Search",
  primaryColor: COLORS.primary,
  secondaryColor: COLORS.secondary,
};

// Navbar Height Variables
export const NAVBAR_HEIGHTS = {
  mobile: "7rem",      // 112px
  desktop: "10.5rem",  // 168px
};

// Mobile Header Configuration
export const MOBILE_HEADER = {
  title: "Welcome",
  subtitle: "Manage your property journey",
  icon: "FaUser",
  buttons: [
    {
      label: "Sign In",
      action: "login",
      bgColor: COLORS.secondary,
      textColor: "text-white",
    },
    {
      label: "Register",
      action: "register",
      bgColor: "transparent",
      textColor: "text-white",
      borderColor: "border-white",
    },
  ],
};

// Font Configuration
export const FONTS = {
  url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap",
  family: "Montserrat",
};

// Mobile Menu Logout Button Configuration
export const LOGOUT_BUTTON = {
  label: "Log Out / Switch Account",
  icon: "FaSignOutAlt",
  action: "login",
  textColor: "text-slate-700",
  hoverColor: "hover:text-[#F96302]",
  hoverBgColor: "hover:bg-orange-50",
};
