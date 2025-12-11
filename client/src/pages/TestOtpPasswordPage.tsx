import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabaseAuth } from "@/lib/supabase-auth";
import { supabase } from "@/lib/supabase-client";

export default function TestOtpPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [phone, setPhone] = useState("");
  const [authType, setAuthType] = useState<"login" | "signup">("login");
  const [verificationMethod, setVerificationMethod] = useState<"otp" | "password">("otp");
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Password state (for signup)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Get phone and auth type from sessionStorage
    const storedPhone = sessionStorage.getItem("testAuthPhone");
    const storedAuthType = sessionStorage.getItem("testAuthType");
    
    if (storedPhone) {
      setPhone(storedPhone);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Phone number not found. Please start over.",
      });
      setTimeout(() => {
        setLocation("/test-auth", { replace: true });
      }, 2000);
    }
    
    if (storedAuthType) {
      setAuthType(storedAuthType as "login" | "signup");
      // For signup, show password option; for login, only OTP
      if (storedAuthType === "signup") {
        setVerificationMethod("password");
      }
    }
  }, [setLocation, toast]);

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.replace(/\D/g, '').split('');
    
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    const lastIndex = Math.min(digits.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabaseAuth.auth.verifyOtp({
        phone: phone,
        token: otpCode,
        type: authType === "signup" ? "sms" : "sms",
      });

      if (error) throw error;

      if (data.user) {
        // Check if phone is verified (OTP verification confirms this)
        const isPhoneVerified = data.user.phone_confirmed_at !== null || data.user.confirmed_at !== null;
        
        if (!isPhoneVerified && authType === "signup") {
          // Phone not verified - shouldn't happen after OTP verification, but check anyway
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Phone number not verified. Please try again.",
          });
          setIsVerifying(false);
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
          return;
        }
        
        // Store user info
        localStorage.setItem("userId", data.user.id);
        if (data.user.phone) {
          localStorage.setItem("phone", data.user.phone);
        }
        
        // Clean up session storage
        sessionStorage.removeItem("testAuthPhone");
        sessionStorage.removeItem("testAuthType");
        
        // Show verification success snackbar
        if (authType === "signup") {
          toast({
            title: "Verification Successful!",
            description: "Phone verified! Account created successfully! Please enter your name to continue",
          });
        } else {
          toast({
            title: "Verification Successful!",
            description: "Phone verified! Logged in successfully!",
          });
        }
        
        // Wait a moment for snackbar to show, then check user record
        setTimeout(async () => {
          try {
            // Check if user exists in users table
            let userRecord = await supabase.selectOne("users", {
              filter: { id: `eq.${data.user.id}` }
            });
            
            const tempUsernamePattern = /^user_\d{4}(?:_\d+)?$/;
            const hasUsername = userRecord?.username && !tempUsernamePattern.test(userRecord.username);
            
            if (authType === "signup") {
              // For signup, always go to name screen (user record will be created by middleware)
              // Only proceed if phone is verified
              if (isPhoneVerified) {
                sessionStorage.setItem('needsName', 'true');
                setLocation("/name", { replace: true });
              }
            } else if (hasUsername && userRecord) {
              // Login with existing username - go to homepage
              localStorage.setItem("username", userRecord.username);
              // Clear any stale needsName flag
              sessionStorage.removeItem('needsName');
              setLocation("/", { replace: true });
            } else {
              // Login without username or has temp username - go to name screen
              if (isPhoneVerified) {
                sessionStorage.setItem('needsName', 'true');
                setLocation("/name", { replace: true });
              }
            }
          } catch (error) {
            // If error, still redirect to name screen (middleware will create user record)
            console.log("User record check error (will be created by middleware):", error);
            if (authType === "signup" && isPhoneVerified) {
              sessionStorage.setItem('needsName', 'true');
              setLocation("/name", { replace: true });
            }
          }
        }, 2000); // Delay to show snackbar
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
      });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify with password (for signup)
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // For phone signup with password, we need to update the user after OTP verification
      // Since Supabase phone auth requires OTP, we'll use a different flow
      // First, verify OTP if we have it, then update password
      // For now, let's use email signup flow with phone as email
      
      // Actually, Supabase phone auth requires OTP first, then we can set password
      // So this flow should be: OTP -> Set password
      // But for simplicity, let's show that password is set after OTP verification
      
      toast({
        variant: "destructive",
        title: "Note",
        description: "Phone signup requires OTP verification first. Please use OTP method.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to set password",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      const { error } = await supabaseAuth.auth.signInWithOtp({
        phone: phone,
      });

      if (error) throw error;

      toast({
        title: "OTP Resent!",
        description: "Please check your phone for the new verification code",
      });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend OTP",
      });
    }
  };

  // Format phone for display
  const formatPhoneDisplay = (phone: string): string => {
    if (!phone) return "";
    // Remove +91 and show last 10 digits
    const cleaned = phone.replace(/^\+91/, "");
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/test-auth", { replace: true })}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardTitle className="text-2xl font-bold text-center">
            {verificationMethod === "otp" ? "Enter Verification Code" : "Set Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {verificationMethod === "otp" 
              ? `Enter the 6-digit code sent to ${formatPhoneDisplay(phone)}`
              : "Create a password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authType === "signup" && (
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={verificationMethod === "otp" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setVerificationMethod("otp")}
              >
                OTP
              </Button>
              <Button
                type="button"
                variant={verificationMethod === "password" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setVerificationMethod("password")}
              >
                <Lock className="mr-2 h-4 w-4" />
                Password
              </Button>
            </div>
          )}

          {verificationMethod === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-12 text-center text-2xl font-semibold"
                  />
                ))}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={otp.join('').length !== 6 || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendOtp}
                  disabled={isVerifying}
                  className="text-sm"
                >
                  Resend OTP
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!password || !confirmPassword || isVerifying}
              >
                {isVerifying ? "Setting password..." : "Set Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

