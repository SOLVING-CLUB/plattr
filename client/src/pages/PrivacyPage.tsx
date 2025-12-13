import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPage() {
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
            Privacy Policy
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
              Hostify Technologies Private Limited (referred to as "Plattr," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use Plattr's services (including our website and mobile applications). By using our services, you agree to the terms of this Privacy Policy.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">Company and Contact Information</h2>
            <p className="mb-4">
              Plattr is a brand operated by Hostify Technologies Private Limited, a private limited company registered in India (incorporated on 21 November 2025). Our registered office is located in Hyderabad, Telangana, India. If you have any questions or concerns about this Privacy Policy, you can contact us at support@plattr.com.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">Information We Collect</h2>
            <p className="mb-4"><strong>Personal Information You Provide:</strong></p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Identity and Contact Data:</strong> Name, phone number, email address, and delivery address for orders.</li>
              <li><strong>Order Details:</strong> Information related to your orders or event bookings, such as date, time, number of guests, menu selections, and special requests.</li>
              <li><strong>Payment Information:</strong> We use Razorpay as our payment gateway. We do not store your sensitive payment card details on our servers.</li>
              <li><strong>Communications:</strong> If you contact us, we collect the information you provide in those communications.</li>
            </ul>

            <p className="mb-4"><strong>Information Collected Automatically:</strong></p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Device and Usage Data:</strong> IP address, browser type, device type, operating system, pages viewed, and dates/times of visits.</li>
              <li><strong>Cookies & Similar Technologies:</strong> We use cookies, pixels, and similar tracking technologies to recognize you and your preferences.</li>
            </ul>

            <h2 className="text-base font-semibold mt-6 mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>To Provide Services:</strong> Create and manage your account, process and fulfill orders, and facilitate catering services.</li>
              <li><strong>Order Coordination:</strong> Share necessary details with restaurant partners and delivery personnel to fulfill your order.</li>
              <li><strong>Payments:</strong> Process payments and protect against fraud via Razorpay.</li>
              <li><strong>Customer Support:</strong> Send service-related communications and respond to inquiries.</li>
              <li><strong>Marketing:</strong> If you have opted in, send promotional communications about offers and events.</li>
              <li><strong>Analytics:</strong> Understand how users engage with our platform to improve services.</li>
            </ul>

            <h2 className="text-base font-semibold mt-6 mb-3">Disclosure of Your Information</h2>
            <p className="mb-4">
              We value your privacy and do not sell your personal information to third parties. We share your information with:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Service Providers:</strong> Payment processing (Razorpay), analytics (Google Analytics, Firebase), and CRM (Zoho CRM).</li>
              <li><strong>Restaurant and Delivery Partners:</strong> To prepare and deliver your orders.</li>
              <li><strong>Legal Compliance:</strong> When required by law or to protect our rights.</li>
            </ul>

            <h2 className="text-base font-semibold mt-6 mb-3">Data Security</h2>
            <p className="mb-4">
              We implement industry-standard encryption (TLS/SSL) and access controls to protect your personal information. Our payment processor Razorpay is PCI-DSS compliant.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">Data Retention</h2>
            <p className="mb-4">
              We retain your personal information only for as long as necessary to fulfill the purposes we collected it for, including legal, accounting, or reporting requirements.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">Your Rights</h2>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Access and Update:</strong> You can access and update your personal information through your account settings.</li>
              <li><strong>Opt-Out:</strong> You can opt out of marketing communications at any time.</li>
              <li><strong>Account Deletion:</strong> You can request account deletion via profile settings or customer support.</li>
            </ul>

            <h2 className="text-base font-semibold mt-6 mb-3">Children's Privacy</h2>
            <p className="mb-4">
              Plattr's services are not intended for children under the age of 16, and we do not knowingly collect personal information from anyone under 16.
            </p>

            <h2 className="text-base font-semibold mt-6 mb-3">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
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
