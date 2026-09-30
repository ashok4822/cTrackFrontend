import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Building2, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearError } from "@/store/slices/authSlice";

const OperatorLogin = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, user, accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user && accessToken) {
      if (user.role === "operator") {
        navigate("/operator/dashboard", { replace: true });
      } else {
        console.warn(
          "OperatorLogin: Non-operator user attempted to access operator portal",
          user.role,
        );
      }
    }
  }, [user, accessToken, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resultAction = await dispatch(
        login({ email, password, role: "operator" }),
      );
      if (login.fulfilled.match(resultAction)) {
        navigate("/operator/dashboard");
      } else {
        console.warn("OperatorLogin: Login action failed or not fulfilled", resultAction);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = "operator@demo.com";
    const demoPassword = "Operator@123";
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      const resultAction = await dispatch(
        login({ email: demoEmail, password: demoPassword, role: "operator" }),
      );
      if (login.fulfilled.match(resultAction)) {
        navigate("/operator/dashboard");
      }
    } catch (err) {
      console.error("Demo login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warning/5 via-background to-accent/5">
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

      {/* Login Form */}
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
              <Building2 className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">Operator Login</CardTitle>
            <CardDescription>
              Sign in to access terminal operations dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@ctrack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Forgot Password Link */}
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm text-muted-foreground hover:text-warning"
                  asChild
                >
                  <Link to="/forgot-password?role=operator">Forgot Password?</Link>
                </Button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In as Operator"}
              </Button>

              {/* Error Message */}
              {error && (
                <p className="text-center text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                  {error}
                </p>
              )}

              {/* Demo Login */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-dashed" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or try demo</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full group relative overflow-hidden rounded-lg border-2 border-dashed border-warning/40 bg-warning/5 px-4 py-3 text-sm font-medium text-warning transition-all hover:border-warning hover:bg-warning/10 hover:shadow-sm disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Demo Operator Login</span>
                  </div>
                  <div className="text-right text-xs font-mono text-muted-foreground group-hover:text-warning">
                    <div>operator@demo.com</div>
                    <div>Operator@123</div>
                  </div>
                </div>
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
    </div>
  );
};

export default OperatorLogin;
