import { BrowserRouter, Routes, Route } from "react-router-dom";

//Pages
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Landing/Home page */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin Login & Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Catch-all*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
