import { BrowserRouter, Routes, Route } from "react-router-dom";

//Components
import { AuthProtectedRoute } from "@/components/auth/AuthProtectedRoute";

//Pages
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import OperatorLogin from "@/pages/operator/OperatorLogin";
import CustomerLogin from "@/pages/customer/CustomerLogin";
import CustomerSignup from "@/pages/customer/CustomerSignup";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import OperatorDashboard from "@/pages/operator/OperatorDashboard";
import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import ForgotPassword from "@/pages/common/ForgotPassword";
import ResetPassword from "@/pages/common/ResetPassword";

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Landing/Home page */}
          <Route path="/" element={<LandingPage />} />

          {/*Login Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/operator/login" element={<OperatorLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </AuthProtectedRoute>
            }
          />

          {/* Operator Routes */}
          <Route
            path="/operator/dashboard"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorDashboard />
              </AuthProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </AuthProtectedRoute>
            }
          />

          {/* Catch-all*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
