import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import plattrLogoImage from "@assets/plattr_logo.png";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { edgeFunctions } from "@/lib/supabase-service";

export default function PhoneScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentTime, setCurrentTime] = useState('9:41');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isSendingOtp = useRef(false);

  // Update time every minutex
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
    };
    
    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);


  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, limit to 10 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
  };

  const isValid = phoneNumber.length === 10;

  // Send OTP using standard API
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      if (isSendingOtp.current) {
        throw new Error('OTP request already in progress. Please wait.');
      }

      if (phone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      isSendingOtp.current = true;

      try {
        console.log('📱 Sending OTP to:', phone);
        const data = await edgeFunctions.sendOTP(phone);
        sessionStorage.setItem('phoneNumber', phone);

        console.log('✅ OTP sent successfully!');
        return data;
      } catch (error: any) {
        console.error('❌ OTP send failed:', error);
        throw error;
      } finally {
        isSendingOtp.current = false;
      }
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent!",
        description: "Please check your WhatsApp for the verification code.",
      });
      // Navigate to verification screen
      setLocation('/verification', { replace: true });
    },
    onError: (error: any) => {
      console.error('OTP send error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
      });
    },
  });

  const handleContinue = () => {
    if (isValid) {
      sendOtpMutation.mutate(phoneNumber);
    }
  };

  return (
    <>
      <div 
        className="h-screen flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF5A4 100%)',
          position: 'relative',
          zIndex: 100
        }}
      >
      {/* Status Bar */}
      <div 
        className="flex justify-between items-center px-6"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          minHeight: "44px",
          width: "100%",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "8px"
        }}
      >
        <span className="text-base font-semibold" style={{ color: "#000000", fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>{currentTime}</span>
        <div className="flex gap-1 items-center">
          <div className="w-4 h-3 bg-black"></div>
          <div className="w-4 h-3 bg-black"></div>
          <div className="w-6 h-3 bg-black rounded-sm"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 overflow-y-auto" style={{ paddingTop: '60px' }}>
        {/* Logo */}
        <div className="mb-4 sm:mb-6" style={{ marginTop: "20px" }}>
          <img
            src={plattrLogoImage}
            alt="Plattr Logo"
            className="h-12 sm:h-16 w-auto"
            style={{
              objectFit: "contain",
              height: "98px",
            }}
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6 flex gap-0.5">
          <div className="flex-1 h-1 bg-[#1A9952] rounded-full"></div>
          <div className="flex-1 h-1 bg-[#1A9952] opacity-25 rounded-full"></div>
          <div className="flex-1 h-1 bg-[#1A9952] opacity-25 rounded-full"></div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2 sm:mb-3 leading-tight" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
          What's your<br />phone number?
        </h1>

        {/* Subtitle with WhatsApp branding */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <p className="text-xs sm:text-sm text-[#1A1A1A]" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
            We'll send you a verification code on WhatsApp
          </p>
        </div>

        {/* Phone Input Field */}
        <div className="mb-4 sm:mb-6">
          <input
            type="tel"
            inputMode="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="Enter Your Phone Number"
            className="w-full py-3 px-4 rounded-md border border-[#D9D9D9] bg-white text-[#1A1A1A] text-base focus:outline-none focus:border-[#1A9952] transition-colors"
            style={{
              borderColor: phoneNumber ? '#1A9952' : '#D9D9D9',
              fontFamily: "Sweet Sans Pro, -apple-system, sans-serif"
            }}
          />
        </div>

        {/* Continue Button */}
        <button 
          onClick={handleContinue}
          className="w-full py-3 rounded-md text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all mb-4 sm:mb-6"
          style={{ 
            backgroundColor: (isValid && !sendOtpMutation.isPending) ? '#1A9952' : '#A5D6A7',
            cursor: (isValid && !sendOtpMutation.isPending) ? 'pointer' : 'not-allowed',
            fontFamily: "Sweet Sans Pro, -apple-system, sans-serif"
          }}
          disabled={!isValid || sendOtpMutation.isPending}
        >
          {sendOtpMutation.isPending ? 'Sending OTP...' : 'Continue'}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      </div>
    </>
  );
}

