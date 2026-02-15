import type { NavItem } from "@/types";
import {
  LayoutDashboard,
  Container,
  MapPin,
  DoorOpen,
  Package,
  Truck,
  Receipt,
  FileText,
  Users,
  Settings,
  ScrollText,
  UserCircle,
  PackagePlus,
  Navigation,
  ListChecks,
  Boxes,
  Anchor,
} from "lucide-react";

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Container Management", href: "/admin/containers", icon: Container },
  { title: "Shipping Line", href: "/admin/shippingline", icon: Anchor },
  { title: "Yard Configuration", href: "/admin/yard", icon: MapPin },
  { title: "Gate Operations", href: "/admin/gate", icon: DoorOpen },
  { title: "Stuffing / Destuffing", href: "/admin/stuffing", icon: Package },
  { title: "Vehicles & Equipment", href: "/admin/vehicles", icon: Truck },
  { title: "Transit Tracking", href: "/admin/transit", icon: Navigation },
  { title: "Activities & Charges", href: "/admin/charges", icon: Receipt },
  { title: "Reports & Analytics", href: "/admin/reports", icon: FileText },
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "System Configuration", href: "/admin/settings", icon: Settings },
  { title: "Audit Logs", href: "/admin/audit", icon: ScrollText },
  { title: "Profile", href: "/admin/profile", icon: UserCircle },
];

export const operatorNavItems: NavItem[] = [
  { title: "Dashboard", href: "/operator/dashboard", icon: LayoutDashboard },
  {
    title: "Container Gate Operations",
    href: "/operator/gate",
    icon: DoorOpen,
  },
  { title: "Yard Operations", href: "/operator/yard", icon: MapPin },
  { title: "Cargo Requests", href: "/operator/cargo-requests", icon: Boxes },
  { title: "Stuffing / Destuffing", href: "/operator/stuffing", icon: Package },
  { title: "Equipment & Vehicles", href: "/operator/equipment", icon: Truck },
  { title: "Transit Tracking", href: "/operator/transit", icon: Navigation },
  { title: "Container Lookup", href: "/operator/lookup", icon: Container },
  { title: "Billing", href: "/operator/billing", icon: Receipt },
  { title: "PDA View", href: "/operator/pda", icon: FileText },
  { title: "Profile", href: "/operator/profile", icon: UserCircle },
];

export const customerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { title: "My Containers", href: "/customer/containers", icon: Container },
  {
    title: "Request Container",
    href: "/customer/request-container",
    icon: PackagePlus,
  },
  {
    title: "Container Requests Listing",
    href: "/customer/requests",
    icon: ListChecks,
  },
  { title: "Stuffing / Destuffing", href: "/customer/stuffing", icon: Package },
  { title: "Transit Tracking", href: "/customer/transit", icon: Navigation },
  { title: "Movements", href: "/customer/movements", icon: Truck },
  { title: "Bills", href: "/customer/bills", icon: Receipt },
  { title: "Profile", href: "/customer/profile", icon: UserCircle },
];
