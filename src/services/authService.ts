import api from "./api";
import type { UserRole } from "@/types";

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
        const response = await api.post<LoginResponse>("/auth/login", credentials);
        return response.data;
    },

    googleLogin: async (data: { code: string; role?: UserRole }) => {
        const response = await api.post<LoginResponse>("/auth/google", data);
        return response.data;
    },

    initiateSignup: async (email: string) => {
        const response = await api.post("/auth/initiate-signup", { email });
        return response.data;
    },

    signup: async (credentials: { email: string; password: string; name: string; otp: string }) => {
        const response = await api.post("/auth/signup", credentials);
        return response.data;
    },

    logout: async () => {
        const response = await api.post("/auth/logout");
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await api.post("/auth/forgot-password", { email });
        return response.data;
    },

    resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
        const response = await api.post("/auth/reset-password", data);
        return response.data;
    },

    verifyResetOtp: async (data: { email: string; otp: string }) => {
        const response = await api.post("/auth/verify-reset-otp", data);
        return response.data;
    },
};
