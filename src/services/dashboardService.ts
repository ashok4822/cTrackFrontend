import type { KPIData } from "@/types";
import api from "./api";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const dashboardService = {
    getKPIData: async (): Promise<KPIData> => {
        const response = await api.get<KPIData>(API_ENDPOINTS.DASHBOARD.KPI);
        return response.data;
    },
};
