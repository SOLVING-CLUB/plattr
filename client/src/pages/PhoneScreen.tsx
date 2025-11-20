import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import plattrLogoImage from "@assets/plattr_logo.png";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
        const response = await apiRequest("POST", `/api/auth/send-otp`, {
          phone: phone,
        });
        
        const data = await response.json();
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
        description: "Please check your phone for the verification code.",
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

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#1A1A1A] mb-4 sm:mb-6" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
          Plattr will send you an SMS with a verification code
        </p>

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

