export const API_ENDPOINTS = {
  // ─── Auth ────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: "/auth/login",
    GOOGLE: "/auth/google",
    LOGOUT: "/auth/logout",
    SIGNUP: "/auth/signup",
    INITIATE_SIGNUP: "/auth/initiate-signup",
    REFRESH_TOKEN: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_RESET_OTP: "/auth/verify-reset-otp",
  },

  // ─── Users / Admin ────────────────────────────────────────────────────────
  USERS: {
    GET_ALL: "/users",
    CREATE: "/users",
    BY_ID: (id: string) => `/users/${id}`,
    BLOCK: (id: string) => `/users/${id}/block`,
    PROFILE: "/users/profile",
    PROFILE_IMAGE: "/users/profile/image",
    PASSWORD: "/users/password",
    AUDIT_LOGS: "/users/audit-logs",
  },

  // ─── Containers ───────────────────────────────────────────────────────────
  CONTAINERS: {
    GET_ALL: "/containers",
    CREATE: "/containers",
    MY_CONTAINERS: "/containers/my-containers",
    BY_ID: (id: string) => `/containers/${id}`,
    UPDATE: (id: string) => `/containers/${id}`,
    BLACKLIST: (id: string) => `/containers/${id}/blacklist`,
    UNBLACKLIST: (id: string) => `/containers/${id}/unblacklist`,
    HISTORY: (id: string) => `/containers/${id}/history`,
  },

  // ─── Container Requests ───────────────────────────────────────────────────
  CONTAINER_REQUESTS: {
    GET_ALL: "/container-requests",
    CREATE: "/container-requests",
    MY_REQUESTS: "/container-requests/my-requests",
    UPDATE: (id: string) => `/container-requests/${id}`,
  },

  // ─── Gate Operations ──────────────────────────────────────────────────────
  GATE_OPERATIONS: {
    GET_ALL: "/gate-operations",
    CREATE: "/gate-operations",
  },

  // ─── Equipment ────────────────────────────────────────────────────────────
  EQUIPMENT: {
    GET_ALL: "/equipment",
    CREATE: "/equipment",
    UPDATE: (id: string) => `/equipment/${id}`,
    DELETE: (id: string) => `/equipment/${id}`,
    HISTORY: (id: string) => `/equipment/${id}/history`,
  },

  // ─── Vehicles ─────────────────────────────────────────────────────────────
  VEHICLES: {
    GET_ALL: "/vehicles",
    CREATE: "/vehicles",
    UPDATE: (id: string) => `/vehicles/${id}`,
    DELETE: (id: string) => `/vehicles/${id}`,
  },

  // ─── Yard / Blocks ────────────────────────────────────────────────────────
  YARD: {
    GET_ALL: "/yard",
    CREATE: "/yard",
    UPDATE: (id: string) => `/yard/${id}`,
  },

  // ─── Shipping Lines ───────────────────────────────────────────────────────
  SHIPPING_LINES: {
    GET_ALL: "/shipping-lines",
    CREATE: "/shipping-lines",
    UPDATE: (id: string) => `/shipping-lines/${id}`,
  },

  // ─── Billing ──────────────────────────────────────────────────────────────
  BILLING: {
    // Activities
    ACTIVITIES: "/billing/activities",
    ACTIVITY_BY_ID: (id: string) => `/billing/activities/${id}`,

    // Charges
    CHARGES: "/billing/charges",
    CHARGE_BY_ID: (id: string) => `/billing/charges/${id}`,
    CHARGE_HISTORY: "/billing/charges/history",

    // Cargo Categories
    CARGO_CATEGORIES: "/billing/cargo-categories",
    CARGO_CATEGORY_BY_ID: (id: string) => `/billing/cargo-categories/${id}`,

    // Bills
    BILLS: "/billing/bills",
    BILL_BY_ID: (id: string) => `/billing/bills/${id}`,
    BILL_MARK_PAID: (id: string) => `/billing/bills/${id}/paid`,
    BILL_PAY: (id: string) => `/billing/bills/${id}/pay`,
    BILL_RAZORPAY_ORDER: (id: string) => `/billing/bills/${id}/razorpay/order`,
    BILL_RAZORPAY_VERIFY: (id: string) => `/billing/bills/${id}/razorpay/verify`,
  },

  // ─── PDA (Pre-Deposit Account) ────────────────────────────────────────────
  PDA: {
    GET: "/pda",
    DEPOSIT: "/pda/deposit",
  },

  // ─── Dashboard ────────────────────────────────────────────────────────────
  DASHBOARD: {
    KPI: "/dashboard/kpi",
  },
} as const;

/*
  Centralized API Endpoint Constants
 
  All API paths are relative to the base URL defined in VITE_API_BASE_URL.
  The base URL is configured in the axios instance in services/api.ts.
 
  Usage:
    import { API_ENDPOINTS } from "@/constants/apiEndpoints";
    api.get(API_ENDPOINTS.CONTAINERS.GET_ALL)
    api.get(API_ENDPOINTS.CONTAINERS.BY_ID(id))
 */
