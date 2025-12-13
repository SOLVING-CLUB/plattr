import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 pt-16 pb-3">
          <button
            onClick={() => setLocation("/about")}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="text-page-title"
          >
            Terms & Conditions
          </h1>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: "Sweet Sans Pro" }}>
            Last Updated: December 2025
          </p>

          <div className="prose prose-sm max-w-none text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
            <p className="mb-4">
              Welcome to Plattr! These Terms and Conditions ("Terms") govern your access to and use of Plattr, an online platform provided by Hostify Technologies Private Limited ("Company," "we," "us," or "our"). Plattr connects users with catering services, allowing you to browse and order catered meals or event services from various restaurant and catering partners, with delivery facilitated through our platform.
            </p>

            <p className="mb-4">
              Please read these Terms carefully before using Plattr's website or mobile application (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must refrain from using our services.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By registering an account, placing an order, or otherwise using the Plattr Platform, you confirm that you accept these Terms and agree to comply with them. You also acknowledge our Privacy Policy, which describes how we collect and handle your personal information. If you do not agree to these Terms or the Privacy Policy, you should not use Plattr.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">2. Eligibility</h2>
            <p className="mb-4">
              <strong>Legal Age:</strong> You must be at least 18 years old to create an account or use Plattr's services. By using the Platform, you represent and warrant that you are 18 or older and capable of entering into a binding contract.
            </p>
            <p className="mb-4">
              <strong>Territorial Use:</strong> Plattr is currently available in select locations (primarily within India). By using the Platform, you affirm that you are accessing it from a location where we offer services.
            </p>
            <p className="mb-4">
              <strong>Account Responsibility:</strong> You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account login credentials and for all activities that occur under your account.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">3. Plattr's Role and Services</h2>
            <p className="mb-4">
              Plattr is a facilitator of catering and food delivery services. We are not a restaurant or catering company ourselves; rather, we partner with independent third-party restaurants, caterers ("Restaurant Partners" or "Catering Partners") and delivery service providers ("Delivery Partners") to bring their services to you via our Platform.
            </p>
            <p className="mb-4">
              When you place an order through Plattr, you are entering into a direct contract with the Restaurant/Catering Partner for the provision of food or catering services, and, where delivery is involved, a separate arrangement with the Delivery Partner for the delivery service. Plattr acts as a disclosed agent for these third-party partners to facilitate the transaction.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">4. User Conduct</h2>
            <p className="mb-4">By accessing Plattr, you agree NOT to engage in any of the following activities:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Providing false information or placing fake orders</li>
              <li>Using the Platform for any unlawful purpose</li>
              <li>Attempting to interfere with or disrupt the operation of the Platform</li>
              <li>Using any automated means to access the Platform without permission</li>
              <li>Creating multiple accounts to abuse promotions or referral programs</li>
            </ul>

            <h2 className="text-base font-semibold mt-6 mb-3">5. Orders and Payments</h2>
            <p className="mb-4">
              <strong>Placing Orders:</strong> When you place an order on Plattr, please review your selection carefully before confirming. By confirming an order, you are making an offer to purchase the selected services from the respective Restaurant Partner under these Terms.
            </p>
            <p className="mb-4">
              <strong>Pricing:</strong> All prices for menu items or services will be listed on the Platform. Prices are shown in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.
            </p>
            <p className="mb-4">
              <strong>Payment Methods:</strong> Plattr supports various payment methods including credit cards, debit cards, UPI, net banking, and digital wallets via our payment gateway (Razorpay).
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">6. Cancellation and Refund Policy</h2>
            <p className="mb-4">
              <strong>Instant Orders:</strong> Orders for immediate or same-day delivery cannot be canceled once confirmed, since preparation begins promptly. These orders are generally non-refundable.
            </p>
            <p className="mb-4">
              <strong>Pre-Scheduled Catering Orders:</strong>
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Cancel more than 7 days before: Full refund</li>
              <li>Cancel 3-7 days before: 50% refund</li>
              <li>Cancel within 72 hours: No refund</li>
            </ul>

            <h2 className="text-base font-semibold mt-6 mb-3">7. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, Plattr shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses resulting from your use of our services.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">8. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mb-4">
              <strong>Hostify Technologies Private Limited (Plattr)</strong><br />
              Email: support@plattr.com<br />
              Address: Hyderabad, Telangana, India
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
