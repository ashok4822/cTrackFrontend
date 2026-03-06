import api from "./api";
import type { UserRole } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        role: string;
        name?: string;
        profileImage?: string;
        isBlocked: boolean;
    };
}

export const authService = {
    login: async (credentials: { email: string; password: string; role?: UserRole }) => {
        const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
        return response.data;
    },

    googleLogin: async (data: { code: string; role?: UserRole }) => {
        const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.GOOGLE, data);
        return response.data;
    },

    initiateSignup: async (email: string) => {
        const response = await api.post(API_ENDPOINTS.AUTH.INITIATE_SIGNUP, { email });
        return response.data;
    },

    signup: async (credentials: { email: string; password: string; name: string; otp: string }) => {
        const response = await api.post(API_ENDPOINTS.AUTH.SIGNUP, credentials);
        return response.data;
    },

    logout: async () => {
        const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
        return response.data;
    },

    resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
        const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
        return response.data;
    },

    verifyResetOtp: async (data: { email: string; otp: string }) => {
        const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_RESET_OTP, data);
        return response.data;
    },
};
