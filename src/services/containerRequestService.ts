import api from "./api";

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
        const response = await api.post("/container-requests", data);
        return response.data;
    },

    getMyRequests: async () => {
        const response = await api.get("/container-requests/my-requests");
        return response.data;
    },

    getCustomerContainers: async () => {
        // This will call the containers endpoint with a filter for the logged-in customer
        const response = await api.get("/containers/my-containers");
        return response.data;
    },

    getAllRequests: async () => {
        const response = await api.get("/container-requests");
        return response.data;
    },

    updateRequest: async (id: string, data: Partial<ContainerRequestData>) => {
        const response = await api.put(`/container-requests/${id}`, data);
        return response.data;
    }
};
