import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Mail, Phone, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabaseAuth } from "@/lib/supabase-auth";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/useAuth";

// Helper to create user in users table if doesn't exist
// Uses authenticated Supabase client to respect RLS policies
async function ensureUserInTable(userId: string, email: string | null, phone: string | null) {
  try {
    // Get authenticated session
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Use authenticated Supabase client (respects RLS)
    const { data: existingUser } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      return existingUser;
    }
    
    // User doesn't exist, create them using authenticated client
    const tempUsername = `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: newUser, error: insertError } = await supabaseAuth
      .from('users')
      .insert({
        id: userId,
        username: tempUsername,
        email: email,
        phone: phone,
        password: '',
        is_verified: true,
      })
      .select()
      .single();
    
    if (insertError) {
      // If insert fails (e.g., RLS policy), try to fetch again (might have been created by another process)
      console.warn('Error creating user, trying to fetch:', insertError);
      const { data: fetchedUser } = await supabaseAuth
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      return fetchedUser;
    }
    
    return newUser;
  } catch (error: any) {
    console.error('Error in ensureUserInTable:', error);
    throw error;
  }
}

export default function TestAuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isEmailVerified, loading, initialized } = useAuth();
  
  // Handle redirects when auth state changes
  // Only redirect for email verification flow - login handlers manage their own redirects
  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized || loading) return;
    
    // If not authenticated, stay on this page (show login/signup form)
    if (!isAuthenticated) return;
    
    // User is authenticated - check if this is from email verification
    const pendingVerification = sessionStorage.getItem('pendingEmailVerification');
    
    if (pendingVerification === 'true') {
      // User just verified their email
      if (isEmailVerified) {
        // Email is now verified - proceed to name page
        sessionStorage.removeItem("pendingEmailVerification");
        sessionStorage.removeItem("pendingEmail");
        
        toast({
          title: "Email Verified!",
          description: "Please enter your name to continue",
        });
        
        sessionStorage.setItem('needsName', 'true');
        setLocation("/name", { replace: true });
      }
      // If not verified yet, stay on page (waiting for verification)
      return;
    }
    
    // Check if this is a fresh login (not from a redirect after logout)
    // If user just logged out and came here, don't auto-redirect
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut === 'true') {
      // Clear the flag and stay on page
      sessionStorage.removeItem('justLoggedOut');
      return;
    }
    
    // For regular login, don't redirect here - let the login handlers do it
    // They will check the users table and set username in localStorage
    // Only redirect if user has username already set (from previous session)
    const username = localStorage.getItem('username');
    if (username) {
      // User has username - clear any stale needsName flag and go home
      sessionStorage.removeItem('needsName');
      setLocation("/", { replace: true });
    }
    // Otherwise, stay on page and let login handler manage the redirect
  }, [isAuthenticated, isEmailVerified, initialized, loading, setLocation, toast]);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  
  // Auth method state
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [authType, setAuthType] = useState<"login" | "signup">("login");

  // Format phone number for Supabase (E.164 format)
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // If it starts with 0, remove it
    const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
    // Add +91 for Indian numbers if not already present
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    // If already has country code, return as is
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  };

  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password",
      });
      return;
    }

    setIsLoginLoading(true);
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        // Handle specific Supabase Auth errors
        let errorMessage = error.message || "Failed to login. Please try again.";
        
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.status === 400) {
          
          // Check if user exists in Auth but was created via phone/OTP
          if (error.status === 400) {
            // Try to check if user exists via email lookup
            try {
              const existingUser = await supabase.selectOne("users", {
                filter: { email: `eq.${loginEmail}` }
              });
              
              if (existingUser) {
                errorMessage = "This account was created with phone number. Please use phone login or reset your password.";
              } else {
                errorMessage = "Invalid email or password. If you signed up with phone, please use phone login.";
              }
            } catch (e) {
              // Fall through to default error
            }
          }
          
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
          });
        }
        setIsLoginLoading(false);
        return;
      }

      if (data.user) {
        // Check if email is verified
        const isEmailVerified = data.user.email_confirmed_at !== null;
        
        if (!isEmailVerified) {
          toast({
            variant: "destructive",
            title: "Email Not Verified",
            description: "Please verify your email before logging in. Check your inbox for the verification link.",
          });
          setIsLoginLoading(false);
          return;
        }
        
        // Ensure user exists in users table (create if not)
        try {
          const userRecord = await ensureUserInTable(
            data.user.id,
            data.user.email || null,
            data.user.phone || null
          );
          
          if (userRecord) {
            localStorage.setItem("userId", data.user.id);
            if (data.user.email) {
              localStorage.setItem("email", data.user.email);
            }
            if (userRecord.username) {
              // Check if it's a temp username
              const tempUsernamePattern = /^user_\d{4}(?:_\d+)?$/;
              const hasRealUsername = !tempUsernamePattern.test(userRecord.username);
              
              if (hasRealUsername) {
                localStorage.setItem("username", userRecord.username);
                // Clear any stale needsName flag
                sessionStorage.removeItem('needsName');
              } else {
                // Has temp username - needs to set real name
                sessionStorage.setItem('needsName', 'true');
              }
            } else {
              // No username - needs to set it
              sessionStorage.setItem('needsName', 'true');
            }
            
            toast({
              title: "Success!",
              description: "Logged in successfully",
            });
            
            // Navigate based on whether user needs to set name
            const needsName = sessionStorage.getItem('needsName');
            if (needsName === 'true') {
              setLocation("/name", { replace: true });
            } else {
              setLocation("/", { replace: true });
            }
          } else {
            // This should rarely happen now, but handle it just in case
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create user account. Please try again.",
            });
          }
        } catch (error) {
          console.error('Error checking/creating user:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to verify account. Please try again.",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Handle phone login (OTP)
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || loginPhone.length !== 10) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    setIsLoginLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(loginPhone);
      
      // Check if user exists in users table first
      try {
        const existingUser = await supabase.selectOne("users", {
          filter: { phone: `eq.${formattedPhone}` }
        });
        
        if (!existingUser) {
          toast({
            variant: "destructive",
            title: "User Not Found",
            description: "No account found with this phone number. Please sign up first.",
          });
          setIsLoginLoading(false);
          return;
        }
      } catch (error) {
        // If error checking, still try to send OTP (might be first time using Supabase Auth)
        console.log("Error checking user:", error);
      }
      
      const { data, error } = await supabaseAuth.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      // Store phone in sessionStorage for OTP verification
      sessionStorage.setItem("testAuthPhone", formattedPhone);
      sessionStorage.setItem("testAuthType", "login");
      
      // Show OTP sent snackbar
      toast({
        title: "OTP Sent!",
        description: "Please check your phone for the verification code",
      });
      
      // Navigate to OTP page after a brief delay
      setTimeout(() => {
        setLocation("/test-otp-password", { replace: true });
      }, 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send OTP",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Handle email signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password",
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setIsSignupLoading(true);
    try {
      const { data, error } = await supabaseAuth.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });

      if (error) throw error;

      if (data.user) {
        // Check if email is verified
        const isEmailVerified = data.user.email_confirmed_at !== null;
        
        if (!isEmailVerified) {
          // Email not verified yet - show verification message
          // Best practice: Don't store user data until verified, use Supabase session
          sessionStorage.setItem("pendingEmailVerification", "true");
          sessionStorage.setItem("pendingEmail", signupEmail);
          
          toast({
            title: "Account Created!",
            description: "Please check your email and click the verification link to continue",
            duration: 5000,
          });
          
          setIsSignupLoading(false);
          
          // Best practice: Use Supabase's auth state change listener (via useAuth hook)
          // instead of polling. The useAuth hook will automatically detect when email is verified
          return;
        }
        
        // Email is already verified (shouldn't happen on signup, but handle it)
        localStorage.setItem("userId", data.user.id);
        if (data.user.email) {
          localStorage.setItem("email", data.user.email);
        }
        
        toast({
          title: "Account Created!",
          description: "Email verified! Please enter your name to continue",
        });
        
        setTimeout(async () => {
          try {
            let userRecord = await supabase.selectOne("users", {
              filter: { id: `eq.${data.user.id}` }
            });
            
            const tempUsernamePattern = /^user_\d{4}(?:_\d+)?$/;
            const hasUsername = userRecord?.username && !tempUsernamePattern.test(userRecord.username);
            
            if (!hasUsername || !userRecord) {
              sessionStorage.setItem('needsName', 'true');
              setLocation("/name", { replace: true });
            } else {
              localStorage.setItem("username", userRecord.username);
              setLocation("/", { replace: true });
            }
          } catch (error) {
            console.log("User record check error:", error);
            sessionStorage.setItem('needsName', 'true');
            setLocation("/name", { replace: true });
          }
        }, 2000);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "Failed to create account",
      });
    } finally {
      setIsSignupLoading(false);
    }
  };

  // Handle phone signup (OTP)
  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupPhone || signupPhone.length !== 10) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    setIsSignupLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(signupPhone);
      const { data, error } = await supabaseAuth.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      // Store phone in sessionStorage for OTP verification
      sessionStorage.setItem("testAuthPhone", formattedPhone);
      sessionStorage.setItem("testAuthType", "signup");
      
      // Show OTP sent snackbar
      toast({
        title: "OTP Sent!",
        description: "Please check your phone for the verification code",
      });
      
      // Navigate to OTP page after a brief delay
      setTimeout(() => {
        setLocation("/test-otp-password", { replace: true });
      }, 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send OTP",
      });
    } finally {
      setIsSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Test Authentication
          </CardTitle>
          <CardDescription className="text-center">
            Sign in or create an account using email or phone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authType} onValueChange={(v) => setAuthType(v as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={authMethod === "email" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAuthMethod("email")}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={authMethod === "phone" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAuthMethod("phone")}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Phone
                </Button>
              </div>

              {authMethod === "email" ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Phone Number</Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={loginPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setLoginPhone(value);
                      }}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              )}
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={authMethod === "email" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAuthMethod("email")}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={authMethod === "phone" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAuthMethod("phone")}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Phone
                </Button>
              </div>

              {authMethod === "email" ? (
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSignupLoading}>
                    {isSignupLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePhoneSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={signupPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setSignupPhone(value);
                      }}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSignupLoading}>
                    {isSignupLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

