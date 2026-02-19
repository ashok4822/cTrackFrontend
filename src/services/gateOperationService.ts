import api from "./api";
import type { GateOperation } from "@/types";

export interface CreateGateOperationData {
    type: "gate-in" | "gate-out";
    containerNumber: string;
    vehicleNumber: string;
    driverName: string;
    purpose: "port" | "factory" | "transfer";
    remarks?: string;
    approvedBy?: string;
}

export interface GateOperationFilters {
    type?: "gate-in" | "gate-out";
    containerNumber?: string;
    status?: string;
}

export const gateOperationService = {
    getGateOperations: async (filters?: GateOperationFilters) => {
        const response = await api.get<GateOperation[]>("/gate-operations", { params: filters });
        return response.data;
    },

    createGateOperation: async (data: CreateGateOperationData) => {
        const response = await api.post("/gate-operations", data);
        return response.data;
    },
};
