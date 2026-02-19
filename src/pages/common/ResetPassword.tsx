import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { Factory, ChevronLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPassword, verifyResetOtp, clearError } from "@/store/slices/authSlice";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    const email = searchParams.get("email") || "";
    const role = searchParams.get("role") || "customer";

    const [otp, setOtp] = useState("");
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (timeLeft > 0 && !isOtpVerified) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft, isOtpVerified]);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (otp.length !== 6) {
            setLocalError("Please enter a 6-digit code");
            return;
        }

        const result = await dispatch(verifyResetOtp({ email, otp }));
        if (verifyResetOtp.fulfilled.match(result)) {
            setIsOtpVerified(true);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setLocalError("Password must be at least 8 characters");
            return;
        }

        const result = await dispatch(resetPassword({ email, otp, newPassword: password }));
        if (resetPassword.fulfilled.match(result)) {
            navigate(`/${role}/login`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-success/5 via-background to-primary/5">
            {/* Header */}
            <header className="border-b bg-card/95 backdrop-blur">
                <div className="container flex h-16 items-center px-4 md:px-6">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Reset Password Form */}
            <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md animate-fade-in shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 ring-8 ring-success/5">
                            {isOtpVerified ? (
                                <CheckCircle2 className="h-8 w-8 text-success animate-in zoom-in-50 duration-300" />
                            ) : (
                                <Factory className="h-8 w-8 text-success" />
                            )}
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {isOtpVerified ? "Create New Password" : "Verify OTP"}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {isOtpVerified
                                ? "Your code is verified. Now set a strong password for your account."
                                : `Enter the 6-digit code sent to ${email}`}
                        </CardDescription>

                        {!isOtpVerified && (
                            timeLeft > 0 ? (
                                <p className="text-sm text-primary font-semibold mt-3 bg-primary/5 py-1 px-3 rounded-full inline-block">
                                    Code expires in: {Math.floor(timeLeft / 60)}:
                                    {(timeLeft % 60).toString().padStart(2, "0")}
                                </p>
                            ) : (
                                <p className="text-sm text-destructive font-medium mt-3 bg-destructive/5 py-1 px-3 rounded-full inline-block">
                                    OTP has expired
                                </p>
                            )
                        )}
                    </CardHeader>
                    <CardContent>
                        {!isOtpVerified ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="otp" className="text-sm font-medium">Reset Code</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        required
                                        maxLength={6}
                                        className="text-center text-2xl font-bold tracking-[0.5em] h-14 bg-background border-2 focus-visible:ring-success/20 focus-visible:border-success transition-all"
                                    />
                                </div>

                                {(error || localError) && (
                                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                                        {error || localError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.01]"
                                    disabled={isLoading || timeLeft === 0}
                                >
                                    {isLoading ? "Verifying..." : "Verify Code"}
                                </Button>

                                <div className="text-center pt-2">
                                    <Link
                                        to={`/forgot-password?role=${role}`}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary/30 pb-0.5"
                                    >
                                        Didn't get the code? Resend
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <div className="relative group">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pr-10 focus-visible:ring-success/20 focus-visible:border-success transition-all"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground group-focus-within:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="focus-visible:ring-success/20 focus-visible:border-success transition-all"
                                        />
                                    </div>
                                </div>

                                {(localError || error) && (
                                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                                        {localError || error}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/10 transition-all hover:scale-[1.01]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Resetting..." : "Update Password"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;
