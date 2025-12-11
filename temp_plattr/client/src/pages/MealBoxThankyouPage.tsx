import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import smileyIconImg from "@assets/Group 2087328362_1763919157482.png";
import bgPatternImg from "@assets/image 1670_1763919157478.png";
import pkLogoImg from "@assets/TE-Vintage-01 32_1763919157483.png";

export default function MealBoxThankYou() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between py-12 px-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgPatternImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#F5F5F0",
      }}
    >
      {/* Top Section with Icon and Messages */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto z-10">
        {/* Smiley Icon */}
        <div className="mb-6">
          <img 
            src={smileyIconImg} 
            alt="Success" 
            className="w-20 h-20"
            data-testid="img-success-icon"
          />
        </div>

        {/* Thank You Message */}
        <h1 
          className="text-2xl font-bold mb-4"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            color: "#1A9952" 
          }}
          data-testid="text-thank-you-heading"
        >
          Thank you!
        </h1>

        <p 
          className="text-sm mb-6"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            color: "#1A9952",
            fontWeight: 600
          }}
          data-testid="text-order-placed"
        >
          Your order has been successfully placed
        </p>

        <p 
          className="text-xs leading-relaxed mb-8"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            color: "#06352A"
          }}
          data-testid="text-followup-message"
        >
          Our team will contact you shortly to confirm your order details and the delivery schedule.
        </p>

        {/* Back to Home Button */}
        <Button
          onClick={() => setLocation("/")}
          data-testid="button-back-to-home"
          className="px-8"
          style={{
            backgroundColor: "#1A9952",
            color: "white",
            fontFamily: "Sweet Sans Pro",
            fontWeight: 600,
          }}
        >
          Back to Home
        </Button>
      </div>

      {/* Bottom Section with OK Logo */}
      <div className="relative w-full max-w-md mx-auto mt-8">
        <img 
          src={pkLogoImg} 
          alt="OK Logo" 
          className="w-full h-auto"
          style={{
            maxWidth: "280px",
            margin: "0 auto",
            display: "block"
          }}
          data-testid="img-ok-logo"
        />
      </div>
    </div>
  );
}
