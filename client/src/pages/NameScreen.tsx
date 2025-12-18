import { useState } from 'react';
import { useLocation } from 'wouter';
import plattrLogoImage from "@assets/plattr_logo.png";
import { useToast } from "@/hooks/use-toast";
import { refreshAuthState } from "@/hooks/useAuth";
import { userService } from "@/lib/supabase-service";

export default function NameScreen() {
  const [fullName, setFullName] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  const isValid = fullName.trim().length >= 2;

  const handleContinue = async () => {
    if (isValid && !isSubmitting) {
      setIsSubmitting(true);
      
      try {
        // Save username to the database
        await userService.updateProfile({ username: fullName.trim() });
        
        // Store username locally for quick access
        localStorage.setItem("username", fullName.trim());
        sessionStorage.removeItem('needsName');
        
        // Refresh auth state with new username
        refreshAuthState();
        
        toast({
          title: "Welcome!",
          description: `Welcome to Plattr, ${fullName.trim()}!`,
        });
        
        // Navigate to home page
        setTimeout(() => {
          setLocation('/', { replace: true });
        }, 300);
      } catch (error: any) {
        console.error('Error saving name:', error);
        setIsSubmitting(false);
        
        // Handle duplicate username error
        if (error.message?.includes('Username already taken')) {
          toast({
            variant: "destructive",
            title: "Name Already Used",
            description: "This name is already taken. Please try a different one.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save your name. Please try again.",
          });
        }
      }
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
      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 overflow-y-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}>
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
            backgroundColor: (isValid && !isSubmitting) ? '#1A9952' : '#A5D6A7',
            cursor: (isValid && !isSubmitting) ? 'pointer' : 'not-allowed',
            fontFamily: "Sweet Sans Pro, -apple-system, sans-serif"
          }}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Ready to Plattr'}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
