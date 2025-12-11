import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, AlertCircle, Check, X, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, edgeFunctions } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import FloatingNav from "@/pages/FloatingNav";

type ModalState = "none" | "verify" | "otp" | "success" | "error";

interface UserProfile {
  id: string;
  username: string;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
}

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("profile");
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Fetch user profile
  const { data: userData, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: () => userService.getProfile(),
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (userData) {
      setName(userData.username || "");
      const phoneValue = userData.phone || "";
      setPhone(phoneValue);
      setOriginalPhone(phoneValue);
      setEmail(userData.email || "");
      setIsPhoneVerified(userData.isVerified || false);
    }
  }, [userData]);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(false);

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return edgeFunctions.sendOTP(phoneNumber);
    },
    onSuccess: () => {
      setModalState("otp");
      setOtp(["", "", "", "", "", ""]);
      setOtpError(false);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the OTP",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ phoneNumber, otpCode }: { phoneNumber: string; otpCode: string }) => {
      return edgeFunctions.verifyOTP(phoneNumber, otpCode);
    },
    onSuccess: () => {
      setModalState("success");
      setIsPhoneVerified(true);
      setTimeout(() => setModalState("none"), 2000);
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully",
      });
    },
    onError: (error: any) => {
      setOtpError(true);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { username?: string; email?: string; phone?: string }) => {
      return userService.updateProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      setLocation("/profile");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleGetOtp = () => {
    const phoneNumber = phone.replace(/\D/g, "");
    if (phoneNumber.length !== 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate(phoneNumber);
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setOtpError(true);
      return;
    }
    const phoneNumber = phone.replace(/\D/g, "");
    verifyOtpMutation.mutate({ phoneNumber, otpCode: enteredOtp });
  };

  const handleResendOtp = () => {
    const phoneNumber = phone.replace(/\D/g, "");
    sendOtpMutation.mutate(phoneNumber);
    setOtp(["", "", "", "", "", ""]);
    setOtpError(false);
    otpRefs[0].current?.focus();
  };

  const handleSaveDetails = () => {
    // Check if phone was changed
    const phoneNumber = phone.replace(/\D/g, "");
    const originalPhoneNumber = originalPhone.replace(/\D/g, "");
    const phoneChanged = phoneNumber !== originalPhoneNumber;

    if (phoneChanged && !isPhoneVerified) {
      setShowAlert(true);
      return;
    }

    const updateData: { username?: string; email?: string; phone?: string } = {};
    if (name.trim()) updateData.username = name.trim();
    if (email.trim()) updateData.email = email.trim();
    if (phoneNumber && phoneChanged) updateData.phone = phoneNumber;

    if (Object.keys(updateData).length === 0) {
      toast({
        title: "No Changes",
        description: "Please make some changes before saving",
      });
      return;
    }

    updateProfileMutation.mutate(updateData);
  };

  return (
    <div className="min-h-screen bg-white relative pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button 
          onClick={() => setLocation("/profile")}
          className="flex items-center gap-1 text-[#1A9952] mb-4"
          data-testid="button-back-profile"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </button>
        
        <h1 
          className="text-3xl font-bold text-[#1C1C1C]"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          data-testid="text-page-title"
        >
          Edit Your Profile
        </h1>
      </div>

      {/* Alert Notification */}
      {showAlert && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">
              Please verify your phone number before saving your details.
            </p>
          </div>
          <button 
            onClick={() => setShowAlert(false)}
            className="text-red-500"
            data-testid="button-close-alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      {isLoading ? (
        <div className="px-5 pt-4 space-y-6">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      ) : (
      <div className="px-5 pt-4 space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-[#1A9952] rounded-lg py-3 px-4 text-[#1C1C1C]"
            data-testid="input-name"
              placeholder="Enter your name"
          />
        </div>

        {/* Phone Number Field */}
        <div>
          <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setIsPhoneVerified(false);
              }}
              className="w-full border-[#1A9952] rounded-lg py-3 px-4 text-[#1C1C1C] pr-10"
              data-testid="input-phone"
            />
            {!isPhoneVerified && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
            )}
          </div>
          {!isPhoneVerified && (
            <button
              onClick={() => setModalState("verify")}
              className="text-[#1A9952] text-sm font-medium underline mt-2"
              data-testid="button-verify-phone"
            >
              Verify Phone Number
            </button>
          )}
        </div>

        {/* Email Address Field */}
        <div>
          <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
            Email Address
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-[#1A9952] rounded-lg py-3 px-4 text-[#1C1C1C]"
            data-testid="input-email"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveDetails}
          disabled={updateProfileMutation.isPending}
          className="w-full bg-[#1A9952] hover:bg-[#158442] text-white py-6 rounded-lg font-semibold tracking-wider disabled:opacity-50"
          data-testid="button-save-details"
        >
          {updateProfileMutation.isPending ? "SAVING..." : "SAVE DETAILS"}
        </Button>
      </div>
      )}

      {/* Modal Overlay */}
      {modalState !== "none" && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setModalState("none")}
        >
          {/* Verify Phone Modal */}
          {modalState === "verify" && (
            <div 
              className="bg-white w-full rounded-t-3xl p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-center text-[#1C1C1C] mb-4">
                You Need to Verify Your Mobile Number
              </h2>
              
              <div className="border border-gray-200 rounded-lg py-3 px-4 mb-4">
                <span className="text-[#1C1C1C]">{phone}</span>
              </div>

              <Button
                onClick={handleGetOtp}
                disabled={sendOtpMutation.isPending}
                className="w-full bg-[#1A9952] hover:bg-[#158442] text-white py-4 rounded-lg font-semibold mb-3 disabled:opacity-50"
                data-testid="button-get-otp"
              >
                {sendOtpMutation.isPending ? "SENDING..." : "GET OTP"}
              </Button>

              <Button
                onClick={() => setModalState("none")}
                variant="outline"
                className="w-full border-[#1A9952] text-[#1A9952] py-4 rounded-lg font-semibold"
                data-testid="button-cancel"
              >
                CANCEL
              </Button>
            </div>
          )}

          {/* OTP Entry Modal */}
          {(modalState === "otp" || modalState === "error") && (
            <div 
              className="bg-white w-full rounded-t-3xl p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-center text-[#1C1C1C] mb-6">
                ENTER OTP
              </h2>
              
              <div className="flex justify-center gap-3 mb-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg ${
                      otpError ? "border-red-500" : "border-[#1A9952]"
                    }`}
                    data-testid={`input-otp-${index}`}
                  />
                ))}
              </div>
              
              {sendOtpMutation.isSuccess && (
                <p className="text-center text-sm text-gray-600 mb-4">
                  OTP sent to {phone}
                </p>
              )}

              {otpError && (
                <p className="text-red-500 text-center text-sm mb-4">Recheck OTP</p>
              )}

              <Button
                onClick={handleVerifyOtp}
                disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
                className="w-full bg-[#1A9952] hover:bg-[#158442] text-white py-4 rounded-lg font-semibold mb-3 mt-4 disabled:opacity-50"
                data-testid="button-verify-otp"
              >
                {verifyOtpMutation.isPending ? "VERIFYING..." : "VERIFY OTP"}
              </Button>

              <button
                onClick={handleResendOtp}
                className="w-full text-center text-[#1C1C1C] font-medium underline"
                data-testid="button-resend-otp"
              >
                Resend OTP
              </button>
            </div>
          )}

          {/* Success Modal */}
          {modalState === "success" && (
            <div 
              className="bg-white w-full rounded-t-3xl p-6 pb-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalState("none")}
                className="absolute top-4 right-4 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center"
                data-testid="button-close-success"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex flex-col items-center py-8">
                <div className="w-16 h-16 bg-[#1A9952] rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold text-[#1C1C1C]">
                  OTP Successfully Verified!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
