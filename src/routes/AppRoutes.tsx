import { BrowserRouter, Routes, Route } from "react-router-dom";

//Pages
import LandingPage from "@/pages/LandingPage";

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
