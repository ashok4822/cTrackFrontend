import { BrowserRouter, Routes, Route } from "react-router-dom";

//Pages
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Landing/Home page */}
          <Route path="/" element={<LandingPage />} />

          {/* Catch-all*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
