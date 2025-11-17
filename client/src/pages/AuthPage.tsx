import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Phone, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  initializeRecaptcha, 
  clearRecaptcha, 
  sendFirebaseOTP, 
  verifyFirebaseOTP,
  getFirebaseIdToken,
  type ConfirmationResult 
} from "@/lib/firebase";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaInitialized = useRef(false);
  const isSendingOtp = useRef(false);

  // Log when component mounts
  useEffect(() => {
    console.log('📱 AuthPage component mounted');
    console.log('📱 Current step:', step);
    console.log('📱 Phone:', phone);
    console.log('📱 Username:', username);
  }, []);

  // Check if phone exists
  const checkPhoneMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      console.log('🔍 Checking if phone exists:', phoneNumber);
      try {
        const response = await apiRequest("POST", `/api/auth/check-phone`, { phone: phoneNumber });
        console.log('📥 Phone check response received');
        const data = await response.json();
        console.log('📊 Phone check data:', data);
        return data as { exists: boolean; username: string | null };
      } catch (error) {
        console.error('❌ Phone check failed:', error);
        throw error;
      }
    },
  });

  // Send OTP using Firebase
  const sendOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      console.log('🎯 sendOtpMutation.mutationFn called with:', phoneNumber);
      
      // Prevent multiple simultaneous requests
      if (isSendingOtp.current) {
        console.log('⚠️ OTP request already in progress');
        throw new Error('OTP request already in progress. Please wait.');
      }

      // Validate phone number
      if (!phoneNumber || phoneNumber.length !== 10) {
        console.log('❌ Phone validation failed in mutation:', phoneNumber);
        throw new Error('Please enter a valid 10-digit phone number');
      }

      console.log('✅ Starting OTP send process...');
      isSendingOtp.current = true;

      try {
        // Clear previous reCAPTCHA if exists
        if (recaptchaInitialized.current) {
          clearRecaptcha();
          recaptchaInitialized.current = false;
        }

        // Initialize and render reCAPTCHA
        console.log('🔐 Initializing reCAPTCHA...');
        let recaptcha: RecaptchaVerifier;
        try {
          recaptcha = await initializeRecaptcha('recaptcha-container');
          recaptchaInitialized.current = true;
          console.log('✅ reCAPTCHA initialized successfully');
        } catch (recaptchaError: any) {
          console.error('❌ reCAPTCHA initialization failed:', recaptchaError);
          throw new Error(`reCAPTCHA failed: ${recaptchaError.message || 'Please refresh the page and try again'}`);
        }

        // Small delay to ensure reCAPTCHA is fully ready
        console.log('⏳ Waiting for reCAPTCHA to be ready...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send OTP
        console.log('📱 Sending OTP to:', `+91${phoneNumber}`);
        const confirmation = await sendFirebaseOTP(phoneNumber, recaptcha);
        confirmationResultRef.current = confirmation;
        console.log('✅ OTP sent successfully!');
        
        return { success: true };
      } catch (error: any) {
        console.error('❌ OTP send failed:', error);
        // Clear reCAPTCHA on error so it can be re-initialized
        clearRecaptcha();
        recaptchaInitialized.current = false;
        throw error;
      } finally {
        isSendingOtp.current = false;
      }
    },
    onSuccess: () => {
      setStep("otp");
      toast({
        title: "OTP Sent!",
        description: `We've sent a 6-digit code to +91 ${phone || 'your phone'}. Please check your SMS.`,
      });
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

  // Verify OTP using Firebase and sync with Supabase
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!confirmationResultRef.current) {
        throw new Error("No OTP confirmation found. Please request a new OTP.");
      }

      try {
        // Verify OTP with Firebase
        console.log('Verifying OTP...');
        const firebaseUser = await verifyFirebaseOTP(confirmationResultRef.current, otp);
        console.log('OTP verified successfully');
        
        // Get Firebase ID token
        const idToken = await firebaseUser.getIdToken();
        
        // Get phone number from Firebase user
        const phoneNumber = firebaseUser.phoneNumber?.replace('+91', '') || phone;

        // Sync with Supabase - create/update user
        console.log('Syncing with Supabase...');
        const response = await apiRequest("POST", `/api/auth/firebase-sync`, {
          idToken,
          phone: phoneNumber,
          username: isExistingUser ? undefined : username,
          firebaseUid: firebaseUser.uid,
        });

        // apiRequest throws on error, so if we get here, response is ok
        const data = await response.json();
        
        // Store Firebase token and user info
        localStorage.setItem("firebaseIdToken", idToken);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        
        // Clear reCAPTCHA after successful verification
        clearRecaptcha();
        recaptchaInitialized.current = false;
        
        return data;
      } catch (error: any) {
        console.error('OTP verification error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Invalid OTP. Please try again.';
        
        if (error.message) {
          if (error.message.includes('invalid-verification-code')) {
            errorMessage = 'Invalid OTP code. Please check and try again.';
          } else if (error.message.includes('expired')) {
            errorMessage = 'OTP has expired. Please request a new one.';
          } else if (error.message.includes('session-expired')) {
            errorMessage = 'Session expired. Please request a new OTP.';
          } else {
            errorMessage = error.message;
          }
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data: any) => {
      toast({
        title: "Welcome!",
        description: `Successfully logged in as ${data.user.username}`,
      });
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
      });
    },
  });

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted! Phone:', phone, 'Length:', phone.length);

    if (phone.length !== 10) {
      console.log('❌ Phone validation failed:', phone.length);
      toast({
        variant: "destructive",
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    console.log('✅ Phone validation passed, checking if user exists...');

    // Check if user exists
    try {
      console.log('📞 Calling checkPhoneMutation for:', phone);
      const result = await checkPhoneMutation.mutateAsync(phone);
      console.log('✅ Phone check result:', result);
      setIsExistingUser(result.exists);
      
      if (!result.exists && !username.trim()) {
        console.log('❌ Username required for new user');
        toast({
          variant: "destructive",
          title: "Username Required",
          description: "Please enter a username to create your account",
        });
        return;
      }
      
      // Send OTP using Firebase
      console.log('📱 Starting OTP send mutation for:', phone);
      sendOtpMutation.mutate(phone);
    } catch (error: any) {
      console.error('❌ Error in handlePhoneSubmit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to check phone number",
      });
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
      });
      return;
    }

    verifyOtpMutation.mutate();
  };

  const handleResendOtp = () => {
    // Clear previous confirmation
    confirmationResultRef.current = null;
    setOtp("");
    
    // Clear and reset reCAPTCHA
    clearRecaptcha();
    recaptchaInitialized.current = false;
    
    // Resend OTP
    sendOtpMutation.mutate(phone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* reCAPTCHA container - must exist in DOM for Firebase */}
      <div 
        id="recaptcha-container"
        style={{ 
          position: 'fixed',
          bottom: '0',
          right: '0',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      ></div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-orange-600">
            The Cater Planner
          </CardTitle>
          <CardDescription className="text-base">
            {step === "phone"
              ? "Enter your phone number to get started"
              : "Enter the OTP sent to your phone"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <form 
              onSubmit={(e) => {
                console.log('📝 Form onSubmit triggered!');
                handlePhoneSubmit(e);
              }} 
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="username"
                    data-testid="input-username"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    disabled={sendOtpMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-10"
                    maxLength={10}
                    required
                    disabled={sendOtpMutation.isPending}
                  />
                </div>
                <p className="text-xs text-gray-500">We'll send you a verification code</p>
              </div>

              <Button
                data-testid="button-send-otp"
                type="submit"
                className="w-full"
                size="lg"
                disabled={sendOtpMutation.isPending || checkPhoneMutation.isPending}
                onClick={() => {
                  console.log('🖱️ Send OTP button clicked!');
                  console.log('📱 Phone value:', phone);
                  console.log('👤 Username value:', username);
                }}
              >
                {sendOtpMutation.isPending || checkPhoneMutation.isPending
                  ? "Sending..."
                  : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    OTP sent to <span className="font-semibold">+91 {phone || 'your phone'}</span>
                  </p>
                  {phone && phone.length === 10 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {phone.slice(0, 5)} {phone.slice(5)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium block text-center">
                    Enter 6-Digit OTP
                  </Label>
                  <div className="flex justify-center">
                    <Input
                      id="otp"
                      data-testid="input-otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="w-48 text-center text-2xl tracking-widest font-semibold"
                      disabled={verifyOtpMutation.isPending}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    data-testid="button-resend-otp"
                    type="button"
                    variant="ghost"
                    onClick={handleResendOtp}
                    disabled={sendOtpMutation.isPending}
                    className="text-sm text-orange-600"
                  >
                    Didn't receive code? Resend
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  data-testid="button-verify-otp"
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={verifyOtpMutation.isPending || otp.length !== 6}
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Continue"}
                </Button>

                <Button
                  data-testid="button-back"
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    // Clear confirmation and reCAPTCHA when going back
                    confirmationResultRef.current = null;
                    clearRecaptcha();
                    recaptchaInitialized.current = false;
                  }}
                  disabled={verifyOtpMutation.isPending}
                >
                  Change Phone Number
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
