import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import type { UserRole } from "@/types";

interface AuthProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function AuthProtectedRoute({
  children,
  requiredRole,
}: AuthProtectedRouteProps) {
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If not authenticated, redirect to the appropriate login page
  if (!user || !accessToken) {
    // Determine which login page to redirect to based on the current path
    if (location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    } else if (location.pathname.startsWith("/operator")) {
      return (
        <Navigate to="/operator/login" state={{ from: location }} replace />
      );
    } else {
      return (
        <Navigate to="/customer/login" state={{ from: location }} replace />
      );
    }
  }

  // If a role is required but user doesn't have it
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their own dashboard instead of showing an error page
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === "operator") {
      return <Navigate to="/operator/dashboard" replace />;
    } else {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
