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

export type ContainerSize = "20ft" | "40ft";
export type ContainerType = "standard" | "reefer" | "tank" | "open-top";
export type MovementType = "import" | "export" | "domestic";

export interface Container {
  id: string;
  _id?: string;
  containerNumber: string;
  size: ContainerSize;
  type: ContainerType;
  movementType?: MovementType;
  status: ContainerStatus;
  shippingLine: string;
  customer?: string;
  customerName?: string;
  yardLocation?: YardLocation;
  gateInTime?: string;
  gateOutTime?: string;
  dwellTime?: number;
  weight?: number;
  cargoWeight?: number;
  cargoDescription?: string;
  hazardousClassification?: boolean;
  empty?: boolean;
  sealNumber?: string;
  damaged?: boolean;
  damageDetails?: string;
  blacklisted?: boolean;
  equipment?: string;
  cargoCategory?: string;
}

export interface YardLocation {
  block: string;
}

export interface ContainerHistory {
  id: string;
  containerId: string;
  activity: string;
  details?: string;
  performedBy?: string;
  timestamp: string;
}

// Yard Types
export interface Block {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
}

export interface Yard {
  id: string;
  name: string;
  blocks: Block[];
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
  status: "in-yard" | "out-of-yard";
  gpsDeviceId?: string;
  currentLocation?: string;
}

// Equipment Types
export interface Equipment {
  id: string;
  name: string;
  type: "reach-stacker" | "forklift" | "crane";
  status: "operational" | "maintenance" | "down" | "idle";
  lastMaintenance?: string;
  nextMaintenance?: string;
  operator?: string;
}

export interface EquipmentHistory {
  id: string;
  equipmentId: string;
  activity: string;
  details?: string;
  performedBy?: string;
  timestamp: string;
}

// Gate Operation Types
export interface GateOperation {
  id: string;
  type: "gate-in" | "gate-out";
  containerNumber?: string;
  vehicleNumber: string;
  driverName: string;
  purpose: "port" | "factory" | "transfer";
  timestamp: string;
  approvedBy?: string;
  remarks?: string;
}

// Stuffing/Destuffing Types
export interface StuffingOperation {
  id: string;
  type: "stuffing" | "destuffing";
  containerNumber: string;
  status:
  | "pending"
  | "ready-for-dispatch"
  | "in-transit"
  | "at-factory"
  | "operation-completed"
  | "cancelled"
  | "in-progress"
  | "completed"
  | "approved";
  location: "terminal" | "factory";
  scheduledDate: string;
  completedDate?: string;
  remarks?: string;
}

// Billing Types
export interface Bill {
  id: string;
  billNumber: string;
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
  customer: string;
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
  gateMovements: { name: string; gateIn: number; gateOut: number }[];
  dwellTimeDistribution: { name: string; value: number }[];
  recentActivities: { id: string; action: string; description: string; time: string; type: string }[];
  recentAlerts: { id: string; type: "error" | "warning" | "info" | "success"; title: string; message: string; link?: string }[];
  liveQueue: { id: string; containerNumber: string; status: string; type: string; updatedAt: Date }[];
  activeTasks: { id: string; type: string; status: string; containerNumber: string; createdAt: Date }[];
  equipmentStatusSummary: { id: string; name: string; type: string; status: string }[];
  pdaBalance?: number;
  unpaidBillsAmount?: number;
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
export interface Checkpoint {
  location: string;
  timestamp: string;
  status: string;
  remarks?: string;
}

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
  status:
  | "pending"
  | "approved"
  | "rejected"
  | "in-progress"
  | "completed"
  | "ready-for-dispatch"
  | "in-transit"
  | "at-factory"
  | "operation-completed"
  | "cancelled";
  createdAt: string;
  remarks?: string;
  checkpoints?: Checkpoint[];
  cargoCategoryName?: string;
  cargoCategoryId?: string;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}

export interface ShippingLine {
  id: string;
  shipping_line_name: string;
  shipping_line_code: string;
  createdAt?: string;
  updatedAt?: string;
}
