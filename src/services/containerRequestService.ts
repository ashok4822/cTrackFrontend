import api from "./api";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export interface ContainerRequestData {
    type: "stuffing" | "destuffing";
    status?: "pending" | "approved" | "rejected" | "completed" | "ready-for-dispatch" | "in-transit" | "at-factory" | "operation-completed" | "cancelled";
    containerSize?: string;
    containerType?: string;
    cargoDescription?: string;
    cargoWeight?: number;
    preferredDate?: string;
    specialInstructions?: string;
    isHazardous?: boolean;
    cargoCategoryId?: string;
    cargoCategoryName?: string;
    hazardClass?: string;
    unNumber?: string;
    packingGroup?: string;
    containerId?: string;
    containerNumber?: string;
    remarks?: string;
    equipmentId?: string;
    checkpoints?: Array<{ location: string, timestamp: string, status: string, remarks?: string }>;
}

export const containerRequestService = {
    createRequest: async (data: ContainerRequestData) => {
        const response = await api.post(API_ENDPOINTS.CONTAINER_REQUESTS.CREATE, data);
        return response.data;
    },

    getMyRequests: async () => {
        const response = await api.get(API_ENDPOINTS.CONTAINER_REQUESTS.MY_REQUESTS);
        return response.data;
    },

    getCustomerContainers: async () => {
        const response = await api.get(API_ENDPOINTS.CONTAINERS.MY_CONTAINERS);
        return response.data;
    },

    getAllRequests: async () => {
        const response = await api.get(API_ENDPOINTS.CONTAINER_REQUESTS.GET_ALL);
        return response.data;
    },

    updateRequest: async (id: string, data: Partial<ContainerRequestData>) => {
        const response = await api.put(API_ENDPOINTS.CONTAINER_REQUESTS.UPDATE(id), data);
        return response.data;
    }
};
