import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
import { Factory, ChevronLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { forgotPassword } from "@/store/slices/authSlice";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role") || "customer"; // Default to customer
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await dispatch(forgotPassword(email));
        if (forgotPassword.fulfilled.match(result)) {
            // Directly navigate to reset password page
            navigate(`/reset-password?email=${encodeURIComponent(email)}&role=${role}`);
        }
    };

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

            {/* Forgot Password Form */}
            <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
                <Card className="w-full max-w-md animate-fade-in">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                            <Factory className="h-8 w-8 text-success" />
                        </div>
                        <CardTitle className="text-2xl">Forgot Password</CardTitle>
                        <CardDescription>
                            Enter your email to receive a password reset code
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-center text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>

                            <div className="text-center text-sm">
                                <Link
                                    to={`/${role}/login`}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
