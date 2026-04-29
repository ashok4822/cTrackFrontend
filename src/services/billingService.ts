import api from "./api";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export interface Activity {
    id?: string;
    code: string;
    name: string;
    description: string;
    category: string;
    unitType: string;
    active: boolean;
}

export interface CargoCategory {
    id?: string;
    name: string;
    description?: string;
    chargePerTon: number;
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
    cargoCategoryId?: string;
    cargoCategoryName?: string;
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
    paidAt?: string;
    paymentMethod?: "pda" | "online";
    createdAt: string;
}

export interface BillTransaction {
    id: string;
    billId: string;
    userId: string;
    amount: number;
    method: "pda" | "online";
    status: "pending" | "success" | "failed";
    transactionId?: string;
    orderId?: string;
    errorDetails?: string;
    timestamp: string;
}

export interface CreateBillRequest {
    customer: string;
    containerNumber: string;
    shippingLine: string;
    remarks?: string;
    lineItems: BillLineItem[];
    totalAmount: number;
}

export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    [key: string]: unknown;
}

export interface RazorpayPaymentData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export const billingService = {
    async fetchActivities(): Promise<Activity[]> {
        const response = await api.get<Activity[]>(API_ENDPOINTS.BILLING.ACTIVITIES);
        return response.data;
    },

    async addActivity(activityData: Partial<Activity>): Promise<Activity> {
        const response = await api.post<Activity>(API_ENDPOINTS.BILLING.ACTIVITIES, activityData);
        return response.data;
    },

    async updateActivity(id: string, activityData: Partial<Activity>): Promise<Activity> {
        const response = await api.patch<Activity>(API_ENDPOINTS.BILLING.ACTIVITY_BY_ID(id), activityData);
        return response.data;
    },

    async fetchCharges(): Promise<Charge[]> {
        const response = await api.get<Charge[]>(API_ENDPOINTS.BILLING.CHARGES);
        return response.data;
    },

    async addCharge(chargeData: Partial<Charge>): Promise<Charge> {
        const response = await api.post<Charge>(API_ENDPOINTS.BILLING.CHARGES, chargeData);
        return response.data;
    },

    async updateChargeRate(id: string, rate: number, effectiveFrom?: string, active?: boolean): Promise<Charge> {
        const response = await api.patch<Charge>(API_ENDPOINTS.BILLING.CHARGE_BY_ID(id), { rate, effectiveFrom, active });
        return response.data;
    },

    async fetchChargeHistory(): Promise<ChargeHistory[]> {
        const response = await api.get<ChargeHistory[]>(API_ENDPOINTS.BILLING.CHARGE_HISTORY);
        return response.data;
    },

    async fetchCargoCategories(): Promise<CargoCategory[]> {
        const response = await api.get<CargoCategory[]>(API_ENDPOINTS.BILLING.CARGO_CATEGORIES);
        return response.data;
    },

    async addCargoCategory(categoryData: Partial<CargoCategory>): Promise<CargoCategory> {
        const response = await api.post<CargoCategory>(API_ENDPOINTS.BILLING.CARGO_CATEGORIES, categoryData);
        return response.data;
    },

    async updateCargoCategory(id: string, categoryData: Partial<CargoCategory>): Promise<CargoCategory> {
        const response = await api.patch<CargoCategory>(API_ENDPOINTS.BILLING.CARGO_CATEGORY_BY_ID(id), categoryData);
        return response.data;
    },

    async fetchBills(): Promise<BillRecord[]> {
        const response = await api.get<BillRecord[]>(API_ENDPOINTS.BILLING.BILLS);
        return response.data;
    },

    async fetchOverdueStatus(): Promise<{ hasOverdueBills: boolean }> {
        const response = await api.get<{ hasOverdueBills: boolean }>(API_ENDPOINTS.BILLING.OVERDUE_STATUS);
        return response.data;
    },

    async markBillPaid(id: string): Promise<BillRecord> {
        const response = await api.patch<BillRecord>(API_ENDPOINTS.BILLING.BILL_MARK_PAID(id));
        return response.data;
    },

    async createBill(billData: CreateBillRequest): Promise<BillRecord> {
        const response = await api.post<BillRecord>(API_ENDPOINTS.BILLING.BILLS, billData);
        return response.data;
    },

    async payBill(id: string): Promise<BillRecord> {
        const response = await api.post<BillRecord>(API_ENDPOINTS.BILLING.BILL_PAY(id));
        return response.data;
    },

    async fetchBillById(id: string): Promise<BillRecord> {
        const response = await api.get<BillRecord>(API_ENDPOINTS.BILLING.BILL_BY_ID(id));
        return response.data;
    },

    async createRazorpayOrder(id: string): Promise<RazorpayOrder> {
        const response = await api.post<RazorpayOrder>(API_ENDPOINTS.BILLING.BILL_RAZORPAY_ORDER(id));
        return response.data;
    },

    async verifyRazorpayPayment(id: string, paymentData: RazorpayPaymentData): Promise<BillRecord> {
        const response = await api.post<BillRecord>(API_ENDPOINTS.BILLING.BILL_RAZORPAY_VERIFY(id), paymentData);
        return response.data;
    },

    async fetchBillTransactions(id: string): Promise<BillTransaction[]> {
        const response = await api.get<BillTransaction[]>(`${API_ENDPOINTS.BILLING.BILLS}/${id}/transactions`);
        return response.data;
    },
};

