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
import AdminProfile from "@/pages/admin/AdminProfile";
import CustomerProfile from "@/pages/customer/CustomerProfile";
import OperatorProfile from "@/pages/operator/OperatorProfile";
import OperatorYardOperations from "@/pages/operator/OperatorYardOperations";
import AdminYardConfiguration from "@/pages/admin/AdminYardConfiguration";
import AdminUserManagement from "@/pages/admin/AdminUserManagement";
import AdminShippinglineManagement from "@/pages/admin/AdminShippinglineManagement";
import AdminContainerManagement from "@/pages/admin/AdminContainerManagement";
import AdminContainerDetails from "@/pages/admin/AdminContainerDetails";
import AdminGateOperations from "@/pages/admin/AdminGateOperations";
import AdminVehiclesEquipment from "@/pages/admin/AdminVehiclesEquipment";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import OperatorGateOperations from "@/pages/operator/OperatorGateOperations";
import Unauthorized from "@/pages/common/Unauthorized";
import OperatorContainerLookup from "@/pages/operator/OperatorContainerLookup";
import OperatorEquipmentVehicles from "@/pages/operator/OperatorVehiclesEquipment";
import CustomerRequestContainer from "@/pages/customer/CustomerRequestContainer";
import CustomerRequestsListing from "@/pages/customer/CustomerRequestsListing";
import OperatorCargoRequests from "@/pages/operator/OperatorCargoRequests";
import OperatorStuffingDestuffing from "@/pages/operator/OperatorStuffingDestuffing";
import OperatorTransitTracking from "@/pages/operator/OperatorTransitTracking";
import CustomerTransitTracking from "@/pages/customer/CustomerTransitTracking";
import CustomerMyContainers from "@/pages/customer/CustomerMyContainers";
import CustomerStuffingDestuffing from "@/pages/customer/CustomerStuffingDestuffing";
import AdminStuffingDestuffing from "@/pages/admin/AdminStuffingDestuffing";
import AdminTransitTracking from "@/pages/admin/AdminTransitTracking";
import AdminActivitiesCharges from "@/pages/admin/AdminActivitiesCharges";
import OperatorBilling from "@/pages/operator/OperatorBilling";
import CustomerBills from "@/pages/customer/CustomerBills";
import CustomerPayment from "@/pages/customer/CustomerPayment";
import CustomerPaymentConfirmation from "@/pages/customer/CustomerPaymentConfirmation";

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

          <Route
            path="/admin/profile"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminProfile />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminUserManagement />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/yard"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminYardConfiguration />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/shippingline"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminShippinglineManagement />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/containers"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminContainerManagement />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/containers/:id"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminContainerDetails />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/gate"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminGateOperations />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/vehicles"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminVehiclesEquipment />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminAuditLogs />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/admin/stuffing"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminStuffingDestuffing />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/admin/transit"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminTransitTracking />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/admin/charges"
            element={
              <AuthProtectedRoute requiredRole="admin">
                <AdminActivitiesCharges />
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

          <Route
            path="/operator/profile"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorProfile />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/operator/yard"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorYardOperations />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/operator/gate"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorGateOperations />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/operator/lookup"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorContainerLookup />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/operator/equipment"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorEquipmentVehicles />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/operator/cargo-requests"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorCargoRequests />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/operator/stuffing"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorStuffingDestuffing />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/operator/transit"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorTransitTracking />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/operator/billing"
            element={
              <AuthProtectedRoute requiredRole="operator">
                <OperatorBilling />
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

          <Route
            path="/customer/profile"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerProfile />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/customer/request-container"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerRequestContainer />
              </AuthProtectedRoute>
            }
          />

          <Route
            path="/customer/requests"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerRequestsListing />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/customer/stuffing"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerStuffingDestuffing />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/customer/transit"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerTransitTracking />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/customer/containers"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerMyContainers />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/customer/bills"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerBills />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/customer/payment/:billId"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerPayment />
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/customer/payment-confirmation/:billId"
            element={
              <AuthProtectedRoute requiredRole="customer">
                <CustomerPaymentConfirmation />
              </AuthProtectedRoute>
            }
          />

          {/* Unathorized */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Catch-all*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
