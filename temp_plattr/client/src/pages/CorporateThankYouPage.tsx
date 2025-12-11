import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import handIconImg from "@assets/Group 2087328361.png";
import bgPatternImg from "@assets/image 1668 (1).png";
import pkLogoImg from "@assets/TE-Vintage-01 3 (2).png";

export default function CorporateThankYou() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between py-12 px-4 relative overflow-hidden"
      style={{
        position: "relative",
      }}
    >
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgPatternImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#F5F5F0",
          width: "100%",
          height: "100%",
          minHeight: "100vh",
        }}
      />
      
      {/* Top Section with Icon and Messages */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto z-10 relative">
        {/* Hand Icon */}
        <div className="mb-6">
          <img 
            src={handIconImg} 
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
          data-testid="text-enquiry-sent"
        >
          Your enquiry has been successfully sent
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

      {/* Bottom Section with PK Logo */}
      <div className="relative w-full max-w-md mx-auto mt-8 z-10">
        <img 
          src={pkLogoImg} 
          alt="PK Logo" 
          className="w-full h-auto"
          style={{
            maxWidth: "280px",
            margin: "0 auto",
            display: "block"
          }}
          data-testid="img-pk-logo"
        />
      </div>
    </div>
  );
}
