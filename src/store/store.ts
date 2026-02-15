import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/profileSlice";
import dashboardReducer from "./slices/dashboardSlice";
import yardReducer from "./slices/yardSlice";
import adminReducer from "./slices/adminSlice";
import shippingLineReducer from "./slices/shippingLineSlice";
import containerReducer from "./slices/containerSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    dashboard: dashboardReducer,
    yard: yardReducer,
    admin: adminReducer,
    shippingLine: shippingLineReducer,
    container: containerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
