import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Phone, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { edgeFunctions, userService } from "@/lib/supabase-service";
import { supabaseAuth } from "@/lib/supabase-auth";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);

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
        // Check if user exists in Supabase
        const { data: users, error } = await supabaseAuth
          .from('users')
          .select('username')
          .eq('phone', phoneNumber)
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        return {
          exists: !!users,
          username: users?.username || null,
        };
      } catch (error) {
        console.error('❌ Phone check failed:', error);
        throw error;
      }
    },
  });

  // Send OTP using standard API
  const sendOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      console.log('🎯 sendOtpMutation.mutationFn called with:', phoneNumber);

      // Validate phone number
      if (!phoneNumber || phoneNumber.length !== 10) {
        console.log('❌ Phone validation failed in mutation:', phoneNumber);
        throw new Error('Please enter a valid 10-digit phone number');
      }

      console.log('✅ Starting OTP send process...');

      // Send OTP via Edge Function
      console.log('📱 Sending OTP to:', phoneNumber);
      const data = await edgeFunctions.sendOTP(phoneNumber);
      console.log('✅ OTP sent successfully!', data);
      
      return data;
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

  // Verify OTP using Edge Function
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('Verifying OTP...');
        const data = await edgeFunctions.verifyOTP(
          phone,
          otp,
          isExistingUser ? undefined : username
        );

        console.log('OTP verified successfully', data);
        
        // Store user info
        if (data.user) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        }
        
        return data;
      } catch (error: any) {
        console.error('OTP verification error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Invalid OTP. Please try again.';
        
        if (error.message) {
          if (error.message.includes('Invalid or expired') || error.message.includes('expired')) {
            errorMessage = 'Invalid or expired OTP. Please request a new one.';
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
    setOtp("");
    // Resend OTP
    sendOtpMutation.mutate(phone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
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
