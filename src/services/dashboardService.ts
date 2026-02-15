import type { KPIData } from "@/types";
import { dummyKPIData } from "@/data/dummyData";

// In a real scenario, you would import 'api' and make actual calls
// import api from "./api";

export const dashboardService = {
    getKPIData: async (): Promise<KPIData> => {
        // Simulating API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        return dummyKPIData;

        /* Real implementation:
        const response = await api.get<KPIData>("/dashboard/kpi");
        return response.data;
        */
    },
};
