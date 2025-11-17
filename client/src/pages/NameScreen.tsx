import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import plattrLogoImage from "@assets/plattr_logo.png";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function NameScreen() {
  const [fullName, setFullName] = useState('');
  const [currentTime, setCurrentTime] = useState('9:41');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const tempUsernamePattern = /^user_\d{4}(?:_\d+)?$/;

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

  // Guard route - only allow access right after verification
  useEffect(() => {
    const needsName = sessionStorage.getItem('needsName');
    const storedUsername = localStorage.getItem('username') || '';

    if (needsName || tempUsernamePattern.test(storedUsername)) {
      return;
    }

    if (storedUsername) {
      setLocation('/', { replace: true });
    } else {
      setLocation('/phone', { replace: true });
    }
  }, [setLocation]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  const isValid = fullName.trim().length >= 2;

  // Update username mutation
  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", `/api/auth/update-username`, {
        username: username.trim(),
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      // Store updated username
      localStorage.setItem("username", data.user.username);
      sessionStorage.removeItem('needsName');
      toast({
        title: "Welcome!",
        description: `Welcome to Plattr, ${data.user.username}!`,
      });
      // Navigate to home page after entering name using replace to prevent going back
      // This replaces name in history, so user can't go back to onboarding screens
      setTimeout(() => {
        setLocation('/', { replace: true });
      }, 500);
    },
    onError: (error: any) => {
      console.error('Username update error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update username. Please try again.",
      });
    },
  });

  const handleContinue = () => {
    if (isValid) {
      updateUsernameMutation.mutate(fullName);
    }
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

        {/* Progress Bar - All 3 segments filled (step 3) */}
        <div className="mb-4 sm:mb-6 flex gap-0.5">
          <div className="flex-1 h-1 bg-[#1A9952] rounded-full"></div>
          <div className="flex-1 h-1 bg-[#1A9952] rounded-full"></div>
          <div className="flex-1 h-1 bg-[#1A9952] rounded-full"></div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2 sm:mb-3 leading-tight" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
          What's Your<br />Name?
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#1A1A1A] mb-4 sm:mb-6" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
          Please enter your first and last name
        </p>

        {/* Name Input Field */}
        <div className="mb-4 sm:mb-6">
          <input
            type="text"
            inputMode="text"
            value={fullName}
            onChange={handleNameChange}
            placeholder="Enter Your Full Name"
            className="w-full py-3 px-4 rounded-md border border-[#D9D9D9] bg-white text-[#1A1A1A] text-base focus:outline-none focus:border-[#1A9952] transition-colors"
            style={{
              borderColor: fullName ? '#1A9952' : '#D9D9D9',
              fontFamily: "Sweet Sans Pro, -apple-system, sans-serif"
            }}
          />
        </div>

        {/* Continue Button */}
        <button 
          onClick={handleContinue}
          className="w-full py-3 rounded-md text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all mb-4 sm:mb-6"
          style={{ 
            backgroundColor: (isValid && !updateUsernameMutation.isPending) ? '#1A9952' : '#A5D6A7',
            cursor: (isValid && !updateUsernameMutation.isPending) ? 'pointer' : 'not-allowed',
            fontFamily: "Sweet Sans Pro, -apple-system, sans-serif"
          }}
          disabled={!isValid || updateUsernameMutation.isPending}
        >
          {updateUsernameMutation.isPending ? 'Saving...' : 'Ready to Plattr'}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

