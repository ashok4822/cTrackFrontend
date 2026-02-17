import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAppDispatch } from "@/store/hooks";
import { googleLogin, signup, initiateSignup } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, ChevronLeft, Eye, EyeOff } from "lucide-react";

const CustomerSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [timeLeft, setTimeLeft] = useState(300); // 300 seconds countdown
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      const resultAction = await dispatch(initiateSignup(formData.email));
      if (initiateSignup.fulfilled.match(resultAction)) {
        console.log("OTP sent successfully");
        setStep(2);
      } else {
        if (resultAction.payload) {
          setError(resultAction.payload as string);
        } else {
          setError("Failed to send OTP");
        }
      }
    } catch (err) {
      console.error("Initiate signup error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resultAction = await dispatch(
        signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          otp: formData.otp,
        }),
      );

      if (signup.fulfilled.match(resultAction)) {
        console.log("Signup successful");
        navigate("/customer/login");
      } else {
        if (resultAction.payload) {
          setError(resultAction.payload as string);
        } else {
          setError("Signup failed");
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const resultAction = await dispatch(initiateSignup(formData.email));
      if (initiateSignup.fulfilled.match(resultAction)) {
        console.log("OTP resent successfully");
        setTimeLeft(300);
      } else {
        if (resultAction.payload) {
          setError(resultAction.payload as string);
        } else {
          setError("Failed to resend OTP");
        }
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      console.log("Google Signup Success (Code):", codeResponse);
      try {
        const resultAction = await dispatch(
          googleLogin({ code: codeResponse.code, role: "customer" }),
        );
        if (googleLogin.fulfilled.match(resultAction)) {
          console.log("Google Signup fulfilled, navigating to dashboard");
          navigate("/customer/dashboard");
        }
      } catch (err) {
        console.error("Google Signup Thunk Error:", err);
      }
    },
    onError: (error) => console.log("Google Signup Failed:", error),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/5 via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Signup Form */}
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
              <Factory className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Create Customer Account</CardTitle>
            <CardDescription>
              Register your organization to manage containers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form className="space-y-4" onSubmit={handleInitiateSignup}>
                {/* Organization Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Get Verified"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google OAuth */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => handleGoogleLogin()}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    ></path>
                  </svg>
                  Sign up with Google
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Already have an account?{" "}
                  </span>
                  <Link
                    to="/customer/login"
                    className="text-success hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground">
                    We sent a verification code to{" "}
                    <strong>{formData.email}</strong>
                  </p>
                  <p className="text-sm text-primary font-medium mt-2">
                    Time remaining: {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, "0")}
                  </p>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    value={formData.otp}
                    onChange={handleChange}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </Button>

                {timeLeft === 0 && (
                  <p className="text-xs text-destructive text-center mt-2">
                    OTP has expired. Please request a new one.
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleResendOtp}
                  disabled={timeLeft > 0 || loading}
                >
                  Resend OTP
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back to Signup
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerSignup;
