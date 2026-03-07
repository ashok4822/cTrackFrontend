import api from "./api";
import type { PreDepositAccount, PDATransaction } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const pdaService = {
    getPDA: async (): Promise<PreDepositAccount & { transactions: PDATransaction[] }> => {
        const response = await api.get(API_ENDPOINTS.PDA.GET);
        return response.data;
    },

    getAllPDAs: async (): Promise<PreDepositAccount[]> => {
        const response = await api.get(API_ENDPOINTS.PDA.GET);
        return response.data;
    },

    createPDAOrder: async (amount: number): Promise<any> => {
        const response = await api.post(API_ENDPOINTS.PDA.RAZORPAY_ORDER, { amount });
        return response.data;
    },

    verifyPDAPayment: async (amount: number, paymentData: any): Promise<PDATransaction> => {
        const response = await api.post(API_ENDPOINTS.PDA.RAZORPAY_VERIFY, { amount, ...paymentData });
        return response.data;
    },
};
