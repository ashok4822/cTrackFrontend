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

    depositFunds: async (amount: number, description: string): Promise<PDATransaction> => {
        const response = await api.post(API_ENDPOINTS.PDA.DEPOSIT, { amount, description });
        return response.data;
    },
};
