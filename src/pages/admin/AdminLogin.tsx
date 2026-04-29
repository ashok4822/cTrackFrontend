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
import { ChevronLeft, Eye, EyeOff, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearError } from "@/store/slices/authSlice";
import { UI_MESSAGES } from "@/constants/messages";

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, user, accessToken } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user && accessToken) {
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        console.warn(
          "AdminLogin: Non-admin user attempted to access admin portal",
          user.role,
        );
      }
    }
  }, [user, accessToken, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resultAction = await dispatch(
        login({ email, password, role: "admin" }),
      );
      if (login.fulfilled.match(resultAction)) {
        navigate("/admin/dashboard");
      } else {
        console.warn(
          "AdminLogin: Login action failed or not fulfilled",
          resultAction,
        );
      }
    } catch (err) {
      // Error handled by Redux state
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {UI_MESSAGES.AUTH.BACK_TO_HOME}
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{UI_MESSAGES.TITLES.ADMIN_LOGIN}</CardTitle>
            <CardDescription>
              {UI_MESSAGES.AUTH.ADMIN_LOGIN_DESC}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{UI_MESSAGES.AUTH.WORK_EMAIL}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.EMAIL_EG}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{UI_MESSAGES.AUTH.PASSWORD}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.PASSWORD}
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
                  className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
                  asChild
                >
                  <Link to="/forgot-password?role=admin">{UI_MESSAGES.AUTH.FORGOT_PASSWORD}</Link>
                </Button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? UI_MESSAGES.AUTH.SIGNING_IN : UI_MESSAGES.AUTH.SIGN_IN_ADMIN}
              </Button>

              {/* Error Message */}
              {error && (
                <p className="text-center text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                  {error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
    </div>
  );
};

export default AdminLogin;
