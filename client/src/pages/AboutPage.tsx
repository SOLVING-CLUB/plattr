import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, FileText, Shield, Award } from "lucide-react";

interface AboutItem {
  id: string;
  label: string;
  icon: typeof FileText;
  path: string;
}

const aboutItems: AboutItem[] = [
  { id: "terms", label: "Terms & Conditions", icon: FileText, path: "/terms" },
  { id: "privacy", label: "Privacy Policy", icon: Shield, path: "/privacy" },
  { id: "licenses", label: "Licenses and Registration", icon: Award, path: "/licenses" },
];

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button
            onClick={() => setLocation("/profile")}
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
            About
          </h1>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {aboutItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                index < aboutItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid={`button-${item.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-gray-800 font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
            Plattr by Hostify Technologies Pvt. Ltd.
          </p>
          <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "Sweet Sans Pro" }}>
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
