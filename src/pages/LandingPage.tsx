import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Factory,
  Container,
  ArrowRight,
  BarChart3,
  Shield,
  Truck,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { UI_MESSAGES } from "@/constants/messages";

const userTypes = [
  {
    id: "admin",
    title: UI_MESSAGES.LANDING.USER_TYPES.ADMIN.TITLE,
    description: UI_MESSAGES.LANDING.USER_TYPES.ADMIN.DESC,
    icon: Shield,
    href: "/admin/login",
    color: "bg-primary/10 text-primary",
    features: UI_MESSAGES.LANDING.USER_TYPES.ADMIN.FEATURES,
  },
  {
    id: "operator",
    title: UI_MESSAGES.LANDING.USER_TYPES.OPERATOR.TITLE,
    description: UI_MESSAGES.LANDING.USER_TYPES.OPERATOR.DESC,
    icon: Building2,
    href: "/operator/login",
    color: "bg-warning/10 text-warning",
    features: UI_MESSAGES.LANDING.USER_TYPES.OPERATOR.FEATURES,
  },
  {
    id: "customer",
    title: UI_MESSAGES.LANDING.USER_TYPES.CUSTOMER.TITLE,
    description: UI_MESSAGES.LANDING.USER_TYPES.CUSTOMER.DESC,
    icon: Factory,
    href: "/customer/login",
    color: "bg-success/10 text-success",
    features: UI_MESSAGES.LANDING.USER_TYPES.CUSTOMER.FEATURES,
  },
];

const stats = [
  { label: UI_MESSAGES.LANDING.STATS.CONTAINERS, value: "50,000+", icon: Container },
  { label: UI_MESSAGES.LANDING.STATS.DAILY_OPS, value: "1,200+", icon: Truck },
  { label: UI_MESSAGES.LANDING.STATS.TERMINALS, value: "15", icon: Building2 },
  { label: UI_MESSAGES.LANDING.STATS.UPTIME, value: "99.9%", icon: BarChart3 },
];

const LandingPage = () => {
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && accessToken) {
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "operator") {
        navigate("/operator/dashboard", { replace: true });
      } else if (user.role === "customer") {
        navigate("/customer/dashboard", { replace: true });
      }
    }
  }, [user, accessToken, navigate]);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground font-bold">
              cT
            </div>
            <div>
              <h1 className="font-bold text-foreground">{UI_MESSAGES.COMMON.APP_NAME}</h1>
              <p className="text-xs text-muted-foreground">
                {UI_MESSAGES.LANDING.SUBTITLE}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/about">{UI_MESSAGES.LANDING.NAV.ABOUT}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/contact">{UI_MESSAGES.LANDING.NAV.CONTACT}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Shield className="h-4 w-4" />
              {UI_MESSAGES.LANDING.HERO_BADGE}
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {UI_MESSAGES.LANDING.HERO_TITLE_1}
              <span className="block text-primary">{UI_MESSAGES.LANDING.HERO_TITLE_2}</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              {UI_MESSAGES.LANDING.HERO_DESC}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="gap-2">
                <Link to="/operator/login">
                  {UI_MESSAGES.LANDING.TERMINAL_LOGIN}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </section>

      {/* Stats Section */}
      <section className="border-b bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="mb-3 h-8 w-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Type Selection */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              {UI_MESSAGES.LANDING.SELECT_PORTAL}
            </h2>
            <p className="text-lg text-muted-foreground">
              {UI_MESSAGES.LANDING.SELECT_PORTAL_DESC}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {userTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div
                      className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${type.color}`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl">{type.title}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="mb-6 space-y-2">
                      {type.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="w-full gap-2 group-hover:bg-primary"
                    >
                      <Link to={type.href}>
                        {UI_MESSAGES.LANDING.ENTER_PORTAL}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              {UI_MESSAGES.LANDING.FEATURES_TITLE}
            </h2>
            <p className="text-lg text-muted-foreground">
              {UI_MESSAGES.LANDING.FEATURES_DESC}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {UI_MESSAGES.LANDING.FEATURES_LIST.map((feature, index) => {
              const icons = [Container, Truck, BarChart3, Building2, Shield, BarChart3];
              const Icon = icons[index % icons.length];
              return (
                <div
                  key={index}
                  className="rounded-lg border bg-card p-6 transition-all hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                cT
              </div>
              <span className="font-semibold text-foreground">cTrack TMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {UI_MESSAGES.LANDING.FOOTER_COPYRIGHT}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
