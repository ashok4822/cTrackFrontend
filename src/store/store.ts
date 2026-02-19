import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/profileSlice";
import dashboardReducer from "./slices/dashboardSlice";
import yardReducer from "./slices/yardSlice";
import adminReducer from "./slices/adminSlice";
import shippingLineReducer from "./slices/shippingLineSlice";
import containerReducer from "./slices/containerSlice";
import auditLogReducer from "./slices/auditLogSlice";
import gateOperationReducer from "./slices/gateOperationSlice";
import vehicleReducer from "./slices/vehicleSlice";
import equipmentReducer from "./slices/equipmentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    dashboard: dashboardReducer,
    yard: yardReducer,
    admin: adminReducer,
    shippingLine: shippingLineReducer,
    container: containerReducer,
    auditLog: auditLogReducer,
    gateOperations: gateOperationReducer,
    vehicle: vehicleReducer,
    equipment: equipmentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
