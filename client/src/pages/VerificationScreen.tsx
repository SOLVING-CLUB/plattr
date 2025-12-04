import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import plattrLogoImage from "@assets/plattr_logo.png";
import { edgeFunctions } from "@/lib/supabase-service";
import { supabaseAuth } from "@/lib/supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function VerificationScreen() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [currentTime, setCurrentTime] = useState('9:41');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');

  // Update time every minute
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


  // Get phone number from sessionStorage
  useEffect(() => {
    const storedPhone = sessionStorage.getItem('phoneNumber');
    if (storedPhone) {
      setPhoneNumber(storedPhone);
    } else {
      // If no phone number, redirect back to phone screen
      toast({
        variant: "destructive",
        title: "Error",
        description: "Phone number not found. Please start over.",
      });
      setTimeout(() => {
        setLocation('/phone', { replace: true });
      }, 2000);
    }
  }, [setLocation, toast]);

  // Removed auto-focus - keyboard will only open when user clicks on input

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.replace(/\D/g, '').split('');
    
    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) newCode[i] = digit;
    });
    setCode(newCode);

    // Focus last filled input or first empty
    const lastIndex = Math.min(digits.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const isComplete = code.every(digit => digit !== '');

  // Verify OTP via Edge Function
  const verifyOtpMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      if (!phoneNumber) {
        throw new Error("Phone number not found. Please start over.");
      }

      try {
        console.log('🔐 Verifying OTP...');
        const data = await edgeFunctions.verifyOTP(phoneNumber, otpCode);

        console.log('✅ OTP verified successfully');

        // Note: The Edge Function creates/authenticates the user in Supabase Auth
        // The session is automatically managed by Supabase Auth
        // We still store some data in localStorage for backward compatibility
        if (data.user) {
        localStorage.setItem("userId", data.user.id);
        if (data.user.username) {
          localStorage.setItem("username", data.user.username);
        }
        if (data.user.phone) {
          localStorage.setItem("phone", data.user.phone);
          }
        }

        sessionStorage.removeItem('phoneNumber');

        return data;
      } catch (error: any) {
        console.error('❌ OTP verification error:', error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      const tempUsernamePattern = /^user_\d{4}(?:_\d+)?$/;
      const isTempUsername = tempUsernamePattern.test(data.user?.username || '');
      
      if (isTempUsername) {
        toast({
          title: "Verification Successful!",
          description: "Please enter your name to continue.",
        });
        sessionStorage.setItem('needsName', 'true');
        setLocation('/name', { replace: true });
      } else {
        sessionStorage.removeItem('needsName');
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user?.username || 'User'}`,
        });
        setLocation('/', { replace: true });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
      });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    },
  });

  const handleContinue = () => {
    if (isComplete) {
      const otpCode = code.join('');
      verifyOtpMutation.mutate(otpCode);
    }
  };

  const handleResendOtp = () => {
    setLocation('/phone', { replace: true });
  };

  return (
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
      <div className="flex-1 px-4 sm:px-6 overflow-y-auto" style={{ paddingTop: '60px'  }}>
        {/* Logo */}
        <div className="mb-4 sm:mb-6" style={{ marginBottom: "20px",}}>
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
          <div className="flex-1 h-1 bg-[#1A9952] rounded-full"></div>
          <div className="flex-1 h-1 bg-[#1A9952] opacity-25 rounded-full"></div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2 sm:mb-3 leading-tight" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
          Enter Your<br />Verification Code
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#1A1A1A] mb-4 sm:mb-6" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
          Enter the 6-digit code sent to you at {phoneNumber ? `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}` : 'your phone'}
        </p>

        {/* Code Inputs */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-[57px] h-[57px] sm:w-[60px] sm:h-[60px] border border-[#D9D9D9] rounded-lg text-center text-2xl sm:text-3xl font-medium focus:outline-none focus:border-[#1A9952] bg-white transition-colors flex-shrink-0"
              style={{
                opacity: digit ? 1 : 0.5,
                fontFamily: "Sweet Sans Pro, -apple-system, sans-serif"
              }}
            />
          ))}
        </div>

        {/* Continue Button */}
        <button 
          onClick={handleContinue}
          className="w-full py-3 rounded-md text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all mb-4 sm:mb-6"
          style={{ 
            backgroundColor: (isComplete && !verifyOtpMutation.isPending) ? '#1A9952' : '#A5D6A7',
            cursor: (isComplete && !verifyOtpMutation.isPending) ? 'pointer' : 'not-allowed',
            fontFamily: "Sweet Sans Pro, -apple-system, sans-serif"
          }}
          disabled={!isComplete || verifyOtpMutation.isPending}
        >
          {verifyOtpMutation.isPending ? 'Verifying...' : 'Continue'}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Resend OTP */}
        <div className="flex justify-center items-center gap-1 pb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.167 6.5C12.709 4.682 11.167 3.5 8.833 3.5C6.5 3.5 4.167 5 3.833 7.5M2.833 9.5C3.291 11.318 4.833 12.5 7.167 12.5C9.5 12.5 11.833 11 12.167 8.5" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.167 7.5L3.833 9.167M13.833 8.5L12.167 6.833" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <button 
            onClick={handleResendOtp}
            disabled={verifyOtpMutation.isPending}
            className="text-xs sm:text-sm text-[#1A1A1A] font-medium hover:underline" 
            style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
}

