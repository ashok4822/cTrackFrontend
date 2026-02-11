import { BrowserRouter, Routes, Route } from "react-router-dom";

//Pages
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import OperatorLogin from "@/pages/operator/OperatorLogin";
import CustomerLogin from "@/pages/customer/CustomerLogin";
import CustomerSignup from "@/pages/customer/CustomerSignup";

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Landing/Home page */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin Login & Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Operator Routes */}
          <Route path="/operator/login" element={<OperatorLogin />} />

          {/* Customer Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />

          {/* Catch-all*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
