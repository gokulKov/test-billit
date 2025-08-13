export const metadata = {
  title: "Pricing Plans - Choose Your Fixel Subscription",
  description: "Explore Fixel's flexible pricing plans designed for mobile repair shops and service centers. Choose from Basic, Gold, or Premium plans with features like inventory management, expense tracking, and advanced billing.",
  keywords: [
    "mobile repair software pricing",
    "service management subscription",
    "repair shop software cost",
    "billing software plans",
    "inventory management pricing",
    "business automation pricing",
    "mobile service CRM cost",
    "repair tracking software price",
    "workshop management plans",
    "service center software pricing"
  ],
  openGraph: {
    title: "Fixel Pricing Plans - Affordable Mobile Service Management",
    description: "Choose the perfect plan for your mobile repair business. Starting from free basic plan to premium features for growing service centers.",
    url: "/pricing",
    images: [
      {
        url: "/images/pricing-og.jpg",
        width: 1200,
        height: 630,
        alt: "Fixel Pricing Plans",
      }
    ],
  },
  twitter: {
    title: "Fixel Pricing - Affordable Plans for Every Business",
    description: "Flexible pricing for mobile repair shops. Start free or upgrade for advanced features.",
  },
  alternates: {
    canonical: "/pricing",
  },
  other: {
    "price-range": "₹0 - ₹499 per month",
    "currency": "INR",
    "business-type": "Service Management Software"
  }
};

export default function PricingLayout({ children }) {
  return children;
}
