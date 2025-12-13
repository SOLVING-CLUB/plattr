import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LicensesPage() {
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
            Licenses and Registration
          </h1>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="prose prose-sm max-w-none text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
            <h2 className="text-base font-semibold mb-4">Company Registration</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="mb-2"><strong>Company Name:</strong> Hostify Technologies Private Limited</p>
              <p className="mb-2"><strong>Brand Name:</strong> Plattr</p>
              <p className="mb-2"><strong>Type:</strong> Private Limited Company</p>
              <p className="mb-2"><strong>Incorporation Date:</strong> 21 November 2025</p>
              <p className="mb-2"><strong>Registered Office:</strong> Hyderabad, Telangana, India</p>
              <p className="mb-0"><strong>Country:</strong> India</p>
            </div>

            <h2 className="text-base font-semibold mb-4">Food Safety License</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="mb-2"><strong>FSSAI License:</strong> Applied / Under Process</p>
              <p className="mb-0 text-sm text-gray-500">
                Plattr is in the process of obtaining all necessary food safety and standards certifications as required by the Food Safety and Standards Authority of India (FSSAI).
              </p>
            </div>

            <h2 className="text-base font-semibold mb-4">GST Registration</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="mb-2"><strong>GST Status:</strong> Registered</p>
              <p className="mb-0 text-sm text-gray-500">
                Hostify Technologies Private Limited is registered under the Goods and Services Tax (GST) Act for the provision of services.
              </p>
            </div>

            <h2 className="text-base font-semibold mb-4">Payment Gateway</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="mb-2"><strong>Payment Partner:</strong> Razorpay Software Private Limited</p>
              <p className="mb-2"><strong>Compliance:</strong> PCI-DSS Level 1 Certified</p>
              <p className="mb-0 text-sm text-gray-500">
                All payment transactions are processed securely through Razorpay, which is compliant with Payment Card Industry Data Security Standards.
              </p>
            </div>

            <h2 className="text-base font-semibold mb-4">Third-Party Software Licenses</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="mb-3 text-sm text-gray-500">
                Plattr uses various open-source libraries and third-party services. Key dependencies include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>React:</strong> MIT License</li>
                <li><strong>Tailwind CSS:</strong> MIT License</li>
                <li><strong>Radix UI:</strong> MIT License</li>
                <li><strong>Lucide Icons:</strong> ISC License</li>
                <li><strong>Google Analytics:</strong> Google Terms of Service</li>
                <li><strong>Firebase:</strong> Google Terms of Service</li>
                <li><strong>Razorpay SDK:</strong> Razorpay Terms of Service</li>
              </ul>
            </div>

            <h2 className="text-base font-semibold mb-4">Intellectual Property</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="mb-2 text-sm text-gray-500">
                The Plattr name, logo, and all related marks, images, and content displayed on the platform are the property of Hostify Technologies Private Limited. Unauthorized use, reproduction, or distribution is prohibited.
              </p>
              <p className="mb-0 text-sm text-gray-500">
                All restaurant partner logos and food images belong to their respective owners and are used with permission.
              </p>
            </div>

            <h2 className="text-base font-semibold mb-4">Contact for Licensing Inquiries</h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="mb-2"><strong>Email:</strong> legal@plattr.com</p>
              <p className="mb-0"><strong>General Support:</strong> support@plattr.com</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
