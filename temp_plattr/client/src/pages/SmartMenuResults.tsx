import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
import heroImage from "@assets/smart-menu-concierge.png";

export default function SmartMenuResults() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero Section */}
      <div className="relative">
        <img
          src={heroImage}
          alt="Smart Menu Concierge"
          className="w-full h-48 sm:h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => setLocation("/smart-menu-concierge")}
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium shadow-sm"
          style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1
            className="text-2xl sm:text-3xl font-bold text-white mb-1"
            style={{ fontFamily: "Sweet Sans Pro" }}
          >
            Your AI Menu
          </h1>
          <p
            className="text-white/90 text-sm"
            style={{ fontFamily: "Sweet Sans Pro" }}
          >
            Personalized recommendations
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Success Message */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "#F0F9F4" }}
          >
            <Sparkles className="w-10 h-10" style={{ color: "#1A9952" }} />
          </div>

          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
          >
            Menu Recommendations Ready!
          </h2>

          <p
            className="text-gray-600 mb-8 max-w-sm"
            style={{ fontFamily: "Sweet Sans Pro" }}
          >
            Based on your preferences, our AI has curated the perfect menu for your
            event. Our team will contact you shortly with detailed menu options.
          </p>

          <div className="w-full space-y-3">
            <Button
              onClick={() => setLocation("/")}
              className="w-full py-6 text-lg font-semibold"
              style={{
                fontFamily: "Sweet Sans Pro",
                backgroundColor: "#1A9952",
                color: "white",
                borderRadius: "10px",
              }}
              data-testid="button-back-home"
            >
              Back to Home <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              onClick={() => setLocation("/smart-menu-concierge")}
              variant="outline"
              className="w-full py-6 text-lg font-semibold"
              style={{
                fontFamily: "Sweet Sans Pro",
                borderColor: "#1A9952",
                color: "#1A9952",
                borderRadius: "10px",
              }}
              data-testid="button-create-another"
            >
              Create Another Menu
            </Button>
          </div>
        </div>
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}


