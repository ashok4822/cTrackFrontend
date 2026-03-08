import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

//Components
import { AuthProtectedRoute } from "@/components/auth/AuthProtectedRoute";
import { PageLoader } from "@/components/common/PageLoader";
import AdminReportsAnalytics from "@/pages/admin/AdminReportsAnalytics";

// Lazy Pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const OperatorLogin = lazy(() => import("@/pages/operator/OperatorLogin"));
const CustomerLogin = lazy(() => import("@/pages/customer/CustomerLogin"));
const CustomerSignup = lazy(() => import("@/pages/customer/CustomerSignup"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const OperatorDashboard = lazy(
  () => import("@/pages/operator/OperatorDashboard"),
);
const CustomerDashboard = lazy(
  () => import("@/pages/customer/CustomerDashboard"),
);
const ForgotPassword = lazy(() => import("@/pages/common/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/common/ResetPassword"));
const AdminProfile = lazy(() => import("@/pages/admin/AdminProfile"));
const CustomerProfile = lazy(() => import("@/pages/customer/CustomerProfile"));
const OperatorProfile = lazy(() => import("@/pages/operator/OperatorProfile"));
const OperatorYardOperations = lazy(
  () => import("@/pages/operator/OperatorYardOperations"),
);
const AdminYardConfiguration = lazy(
  () => import("@/pages/admin/AdminYardConfiguration"),
);
const AdminUserManagement = lazy(
  () => import("@/pages/admin/AdminUserManagement"),
);
const AdminShippinglineManagement = lazy(
  () => import("@/pages/admin/AdminShippinglineManagement"),
);
const AdminContainerManagement = lazy(
  () => import("@/pages/admin/AdminContainerManagement"),
);
const AdminContainerDetails = lazy(
  () => import("@/pages/admin/AdminContainerDetails"),
);
const AdminGateOperations = lazy(
  () => import("@/pages/admin/AdminGateOperations"),
);
const AdminVehiclesEquipment = lazy(
  () => import("@/pages/admin/AdminVehiclesEquipment"),
);
const AdminAuditLogs = lazy(() => import("@/pages/admin/AdminAuditLogs"));
const OperatorGateOperations = lazy(
  () => import("@/pages/operator/OperatorGateOperations"),
);
const Unauthorized = lazy(() => import("@/pages/common/Unauthorized"));
const OperatorContainerLookup = lazy(
  () => import("@/pages/operator/OperatorContainerLookup"),
);
const OperatorEquipmentVehicles = lazy(
  () => import("@/pages/operator/OperatorVehiclesEquipment"),
);
const CustomerRequestContainer = lazy(
  () => import("@/pages/customer/CustomerRequestContainer"),
);
const CustomerRequestsListing = lazy(
  () => import("@/pages/customer/CustomerRequestsListing"),
);
const OperatorCargoRequests = lazy(
  () => import("@/pages/operator/OperatorCargoRequests"),
);
const OperatorStuffingDestuffing = lazy(
  () => import("@/pages/operator/OperatorStuffingDestuffing"),
);
const OperatorTransitTracking = lazy(
  () => import("@/pages/operator/OperatorTransitTracking"),
);
const CustomerTransitTracking = lazy(
  () => import("@/pages/customer/CustomerTransitTracking"),
);
const CustomerMyContainers = lazy(
  () => import("@/pages/customer/CustomerMyContainers"),
);
const CustomerStuffingDestuffing = lazy(
  () => import("@/pages/customer/CustomerStuffingDestuffing"),
);
const AdminStuffingDestuffing = lazy(
  () => import("@/pages/admin/AdminStuffingDestuffing"),
);
const AdminTransitTracking = lazy(
  () => import("@/pages/admin/AdminTransitTracking"),
);
const AdminActivitiesCharges = lazy(
  () => import("@/pages/admin/AdminActivitiesCharges"),
);
const OperatorBilling = lazy(() => import("@/pages/operator/OperatorBilling"));
const CustomerBills = lazy(() => import("@/pages/customer/CustomerBills"));
const CustomerPayment = lazy(() => import("@/pages/customer/CustomerPayment"));
const CustomerPaymentConfirmation = lazy(
  () => import("@/pages/customer/CustomerPaymentConfirmation"),
);
const OperatorPDAView = lazy(() => import("@/pages/operator/OperatorPDAView"));
const CustomerPDA = lazy(() => import("@/pages/customer/CustomerPDA"));

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
            <Route
              path="/admin/reports"
              element={
                <AuthProtectedRoute requiredRole="admin">
                  <AdminReportsAnalytics />
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
            <Route
              path="/operator/pda"
              element={
                <AuthProtectedRoute requiredRole="operator">
                  <OperatorPDAView />
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
              path="/customer/pda"
              element={
                <AuthProtectedRoute requiredRole="customer">
                  <CustomerPDA />
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
        </Suspense>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
