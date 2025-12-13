import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import FloatingNav from "@/pages/FloatingNav";
import noServiceImage from "@assets/Good_Food_Takes_Time_(4)_1765642758756.png";

interface NoServicePageProps {
  onLocationClick?: () => void;
  locationLabel?: string;
}

export default function NoServicePage({ onLocationClick, locationLabel = "Select Address" }: NoServicePageProps) {
  const [, setLocation] = useLocation();
  
  console.log("NoServicePage rendering", { locationLabel });

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    if (tab === "home") setLocation("/");
    else if (tab === "menu") setLocation("/menu");
    else if (tab === "profile") setLocation("/profile");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="absolute top-0 left-0 right-0 z-10 h-40 px-4 flex items-end justify-between pb-4">
        <Button 
          variant="ghost" 
          className="gap-2 font-medium text-white hover:bg-black/10 bg-black/20 backdrop-blur-sm rounded-lg"
          onClick={onLocationClick}
          data-testid="button-location"
        >
          <MapPin className="w-5 h-5" />
          <span
            className="ml-[0px] mr-[0px] pl-[0px] pr-[0px] text-left pt-[0px] pb-[0px] font-semibold text-[18px]"
            style={{ fontFamily: "Sweet Sans Pro" }}
          >
            {locationLabel}
          </span>
        </Button>

        <button
          onClick={() => setLocation("/concierge")}
          data-testid="button-smart-menu-concierge"
          className="flex items-center justify-center px-3 py-2 rounded-[10px] shadow-md hover:opacity-90 transition-opacity self-end"
          style={{
            background: "linear-gradient(135deg, #06352A 0%, #1A9952 100%)",
            fontFamily: "Sweet Sans Pro",
            fontSize: "12px",
            fontWeight: 500,
            color: "#F5E9DB",
            height: "40px",
          }}
        >
          AI Menu Planner
        </button>
      </div>

      <div className="flex-1 pb-20" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <img 
          src={noServiceImage} 
          alt="Good food takes time - We're setting up kitchens and deliveries in your area"
          className="w-full h-full object-cover object-top"
          data-testid="img-no-service"
        />
      </div>

      <FloatingNav activeTab="home" onTabChange={handleTabChange} />
    </div>
  );
}
