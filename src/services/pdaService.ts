import api from "./api";
import { PreDepositAccount, PDATransaction } from "@/types";

export const pdaService = {
    getPDA: async (): Promise<PreDepositAccount & { transactions: PDATransaction[] }> => {
        const response = await api.get("/pda");
        return response.data;
    },

    getAllPDAs: async (): Promise<PreDepositAccount[]> => {
        const response = await api.get("/pda");
        return response.data;
    },

    depositFunds: async (amount: number, description: string): Promise<PDATransaction> => {
        const response = await api.post("/pda/deposit", { amount, description });
        return response.data;
    },
};
