//User Types
export type UserRole = "admin" | "operator" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  avatar?: string;
  profileImage?: string;
  companyName?: string;
  isBlocked: boolean;
}

// Container Types
export type ContainerStatus =
  | "in-yard"
  | "in-transit"
  | "at-port"
  | "at-factory"
  | "damaged"
  | "pending"
  | "gate-in"
  | "gate-out";

export type ContainerSize = "20ft" | "40ft" | "45ft";
export type ContainerType =
  | "standard"
  | "reefer"
  | "tank"
  | "open-top"
  | "flat-rack";
export type MovementType = "import" | "export" | "domestic";

export interface Container {
  id: string;
  containerNumber: string;
  size: ContainerSize;
  type: ContainerType;
  movementType: MovementType;
  status: ContainerStatus;
  shippingLine: string;
  customer?: string;
  yardLocation?: YardLocation;
  gateInTime?: string;
  gateOutTime?: string;
  dwellTime?: number;
  weight?: number;
  sealNumber?: string;
  damaged?: boolean;
  damageDetails?: string;
}

export interface YardLocation {
  block: string;
}

// Yard Types
export interface YardBlock {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
}

export interface Yard {
  id: string;
  name: string;
  blocks: YardBlock[];
  totalCapacity: number;
  currentOccupancy: number;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  type: "truck" | "trailer" | "chassis";
  status: "active" | "inactive" | "maintenance";
  gpsDeviceId?: string;
  currentLocation?: string;
}

// Equipment Types
export interface Equipment {
  id: string;
  name: string;
  type: "reach-stacker" | "forklift" | "crane" | "straddle-carrier";
  status: "operational" | "maintenance" | "down";
  lastMaintenance?: string;
  nextMaintenance?: string;
  operator?: string;
}

// Survey Types
export interface Survey {
  id: string;
  containerId: string;
  containerNumber: string;
  surveyorId: string;
  surveyorName: string;
  status: "pending" | "in-progress" | "completed";
  priority: "normal" | "urgent";
  location: string;
  createdAt: string;
  completedAt?: string;
  findings?: SurveyFindings;
}

export interface SurveyFindings {
  exteriorCondition: "good" | "fair" | "poor";
  doorCondition: "good" | "fair" | "poor";
  floorCondition: "good" | "fair" | "poor";
  structuralDamage: boolean;
  damageSeverity?: "minor" | "moderate" | "severe";
  description?: string;
  photos?: string[];
  recommendation: "clear" | "repair-required" | "hold";
}

// Gate Operation Types
export interface GateOperation {
  id: string;
  type: "gate-in" | "gate-out";
  containerId: string;
  containerNumber: string;
  vehicleNumber: string;
  driverName: string;
  purpose: "port" | "factory" | "transfer";
  status: "pending" | "approved" | "completed" | "rejected";
  timestamp: string;
  approvedBy?: string;
  remarks?: string;
}

// Stuffing/Destuffing Types
export interface StuffingOperation {
  id: string;
  type: "stuffing" | "destuffing";
  containerId: string;
  containerNumber: string;
  status: "pending" | "in-progress" | "completed" | "approved";
  location: "terminal" | "factory";
  scheduledDate: string;
  completedDate?: string;
  remarks?: string;
}

// Billing Types
export interface Bill {
  id: string;
  billNumber: string;
  containerId: string;
  containerNumber: string;
  shippingLine: string;
  customer?: string;
  activities: BillActivity[];
  totalAmount: number;
  status: "pending" | "paid" | "overdue";
  generatedAt: string;
  dueDate: string;
  paidAt?: string;
}

export interface BillActivity {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Pre-Deposit Account Types
export interface PreDepositAccount {
  id: string;
  shippingLine: string;
  balance: number;
  lastUpdated: string;
  transactions: PDATransaction[];
}

export interface PDATransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  timestamp: string;
  balanceAfter: number;
}

// Approval Types
export interface Approval {
  id: string;
  type: "gate-out" | "damage-clearance" | "stuffing" | "destuffing";
  requestId: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  details: Record<string, unknown>;
}

// Report Types
export interface Report {
  id: string;
  name: string;
  type: "operational" | "yard" | "dwell-time" | "equipment" | "container";
  generatedAt: string;
  period: string;
  format: "pdf" | "excel";
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: "alert" | "info" | "warning" | "success";
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

// KPI Types
export interface KPIData {
  totalContainersInYard: number;
  containersInTransit: number;
  gateInToday: number;
  gateOutToday: number;
  yardUtilization: number;
  pendingApprovals?: number;
  pendingSurveys?: number;
  tasksToday?: number;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

// Transit Checkpoint Types
export interface TransitCheckpoint {
  id: string;
  containerId: string;
  containerNumber: string;
  checkpointName: string;
  location: string;
  arrivedAt: string;
  departedAt?: string;
  status: "pending" | "in-transit" | "completed";
  remarks?: string;
}

// Container Request Types
export interface ContainerRequest {
  id: string;
  type: "stuffing" | "destuffing";
  customerId: string;
  customerName: string;
  containerId?: string;
  containerNumber?: string;
  containerSize?: string;
  containerType?: string;
  cargoDescription: string;
  cargoWeight: number;
  isHazardous: boolean;
  hazardClass?: string;
  unNumber?: string;
  packingGroup?: string;
  preferredDate: string;
  status: "pending" | "approved" | "rejected" | "in-progress" | "completed";
  createdAt: string;
  remarks?: string;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}
