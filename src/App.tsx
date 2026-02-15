import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "sonner";

const App = () => {
  return (
    <div>
      <Toaster position="top-right" richColors />
      <AppRoutes />
    </div>
  );
};

export default App;
