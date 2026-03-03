import api from "./api";

export interface Activity {
    id?: string;
    code: string;
    name: string;
    description: string;
    category: string;
    unitType: string;
    active: boolean;
}

export interface Charge {
    id?: string;
    activityId: string;
    activityName?: string;
    containerSize: string;
    containerType: string;
    rate: number;
    currency: string;
    effectiveFrom: string;
    active: boolean;
}

export interface ChargeHistory {
    id?: string;
    chargeId: string;
    activityName: string;
    containerSize: string;
    containerType: string;
    oldRate: number;
    newRate: number;
    currency: string;
    changedAt: string;
}

export interface BillLineItem {
    activityCode: string;
    activityName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface BillRecord {
    id: string;
    billNumber: string;
    containerNumber: string;
    containerId: string;
    shippingLine: string;
    customer: string | null;
    customerName?: string;
    lineItems: BillLineItem[];
    totalAmount: number;
    status: "pending" | "paid" | "overdue";
    dueDate: string;
    remarks?: string;
    createdAt: string;
}

export const billingService = {
    async fetchActivities(): Promise<Activity[]> {
        const response = await api.get<Activity[]>("/billing/activities");
        return response.data;
    },

    async addActivity(activityData: Partial<Activity>): Promise<Activity> {
        const response = await api.post<Activity>("/billing/activities", activityData);
        return response.data;
    },

    async updateActivity(id: string, activityData: Partial<Activity>): Promise<Activity> {
        const response = await api.patch<Activity>(`/billing/activities/${id}`, activityData);
        return response.data;
    },

    async fetchCharges(): Promise<Charge[]> {
        const response = await api.get<Charge[]>("/billing/charges");
        return response.data;
    },

    async addCharge(chargeData: Partial<Charge>): Promise<Charge> {
        const response = await api.post<Charge>("/billing/charges", chargeData);
        return response.data;
    },

    async updateChargeRate(id: string, rate: number, effectiveFrom?: string): Promise<Charge> {
        const response = await api.patch<Charge>(`/billing/charges/${id}`, { rate, effectiveFrom });
        return response.data;
    },

    async fetchChargeHistory(): Promise<ChargeHistory[]> {
        const response = await api.get<ChargeHistory[]>("/billing/charges/history");
        return response.data;
    },

    async fetchBills(): Promise<BillRecord[]> {
        const response = await api.get<BillRecord[]>("/billing/bills");
        return response.data;
    },

    async markBillPaid(id: string): Promise<BillRecord> {
        const response = await api.patch<{ message: string; bill: BillRecord }>(`/billing/bills/${id}/paid`);
        return response.data.bill;
    },

    async createBill(billData: any): Promise<BillRecord> {
        const response = await api.post<BillRecord>("/billing/bills", billData);
        return response.data;
    },

    async payBill(id: string): Promise<BillRecord> {
        const response = await api.post<{ message: string; bill: BillRecord }>(`/billing/bills/${id}/pay`);
        return response.data.bill;
    },

    async fetchBillById(id: string): Promise<BillRecord> {
        const response = await api.get<BillRecord>(`/billing/bills/${id}`);
        return response.data;
    },
};
