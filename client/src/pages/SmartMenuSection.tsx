import { ChevronRight } from "lucide-react";
import conciergeImg from "@assets/Smart Menu_1763871461726.png";

interface SmartMenuConciergeSectionProps {
  onTryNow: () => void;
}

export default function SmartMenuConciergeSection({ onTryNow }: SmartMenuConciergeSectionProps) {   
  return (
    <section className="px-4">
      <div 
        className="relative overflow-hidden"
        style={{
          borderRadius: "10px",
          backgroundImage: `url(${conciergeImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="p-4">
          <h2 
            className="text-[#06352A] mb-2"
            style={{
              fontFamily: "Sweet Sans Pro",
              fontSize: "25px",
              fontWeight: 700,
              lineHeight: "1.1",
            }}
          >
            Smart Menu<br />Concierge
          </h2>
          
          <p 
            className="text-[#06352A] mb-3"
            style={{
              fontFamily: "Sweet Sans Pro",
              fontSize: "10px",
              fontWeight: 400,
              lineHeight: "1.4",
            }}
          >
            Let AI help you create the<br />perfect menu for your event
          </p>
          
          <button
            onClick={onTryNow}
            data-testid="button-try-menu-concierge"
            className="flex items-center gap-2 px-4 py-2 text-[#06352A] font-bold uppercase tracking-wide hover-elevate active-elevate-2"
            style={{
              fontFamily: "Sweet Sans Pro",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #FFD700 0%, #FFFFFF 100%)",
            }}
          >
            TRY NOW
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
