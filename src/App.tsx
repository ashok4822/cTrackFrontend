import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/common/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <div>
        <Toaster position="top-right" richColors />
        <AppRoutes />
      </div>
    </ErrorBoundary>
  );
};

export default App;
