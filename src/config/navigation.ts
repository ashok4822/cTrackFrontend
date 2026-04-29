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
  ScrollText,
  UserCircle,
  PackagePlus,
  Navigation,
  ListChecks,
  Boxes,
  Anchor,
} from "lucide-react";
import { UI_MESSAGES } from "@/constants/messages";

export const adminNavItems: NavItem[] = [
  { title: UI_MESSAGES.TITLES.DASHBOARD, href: "/admin/dashboard", icon: LayoutDashboard },
  { title: UI_MESSAGES.TITLES.CONTAINER_MANAGEMENT, href: "/admin/containers", icon: Container },
  { title: UI_MESSAGES.TITLES.SHIPPING_LINE, href: "/admin/shippingline", icon: Anchor },
  { title: UI_MESSAGES.TITLES.YARD_CONFIGURATION, href: "/admin/yard", icon: MapPin },
  { title: UI_MESSAGES.TITLES.GATE_OPERATIONS, href: "/admin/gate", icon: DoorOpen },
  { title: UI_MESSAGES.TITLES.STUFFING_DESTUFFING, href: "/admin/stuffing", icon: Package },
  { title: UI_MESSAGES.TITLES.VEHICLES_EQUIPMENT, href: "/admin/vehicles", icon: Truck },
  { title: UI_MESSAGES.TITLES.TRANSIT_TRACKING, href: "/admin/transit", icon: Navigation },
  { title: UI_MESSAGES.TITLES.ACTIVITIES_CHARGES, href: "/admin/charges", icon: Receipt },
  { title: UI_MESSAGES.TITLES.REPORTS_ANALYTICS, href: "/admin/reports", icon: FileText },
  { title: UI_MESSAGES.TITLES.USER_MANAGEMENT, href: "/admin/users", icon: Users },
  { title: UI_MESSAGES.TITLES.AUDIT_LOGS, href: "/admin/audit", icon: ScrollText },
  { title: UI_MESSAGES.TITLES.PROFILE, href: "/admin/profile", icon: UserCircle },
];

export const operatorNavItems: NavItem[] = [
  { title: UI_MESSAGES.TITLES.DASHBOARD, href: "/operator/dashboard", icon: LayoutDashboard },
  {
    title: UI_MESSAGES.TITLES.GATE_OPERATIONS,
    href: "/operator/gate",
    icon: DoorOpen,
  },
  { title: UI_MESSAGES.TITLES.YARD_OPERATIONS, href: "/operator/yard", icon: MapPin },
  { title: UI_MESSAGES.TITLES.CARGO_REQUESTS, href: "/operator/cargo-requests", icon: Boxes },
  { title: UI_MESSAGES.TITLES.STUFFING_DESTUFFING, href: "/operator/stuffing", icon: Package },
  { title: UI_MESSAGES.TITLES.VEHICLES_EQUIPMENT, href: "/operator/equipment", icon: Truck },
  { title: UI_MESSAGES.TITLES.TRANSIT_TRACKING, href: "/operator/transit", icon: Navigation },
  { title: UI_MESSAGES.TITLES.CONTAINER_LOOKUP, href: "/operator/lookup", icon: Container },
  { title: UI_MESSAGES.TITLES.BILLING, href: "/operator/billing", icon: Receipt },
  { title: UI_MESSAGES.TITLES.PDA_VIEW, href: "/operator/pda", icon: FileText },
  { title: UI_MESSAGES.TITLES.PROFILE, href: "/operator/profile", icon: UserCircle },
];

export const customerNavItems: NavItem[] = [
  { title: UI_MESSAGES.TITLES.DASHBOARD, href: "/customer/dashboard", icon: LayoutDashboard },
  { title: UI_MESSAGES.TITLES.MY_CONTAINERS, href: "/customer/containers", icon: Container },
  {
    title: UI_MESSAGES.TITLES.REQUEST_CONTAINER,
    href: "/customer/request-container",
    icon: PackagePlus,
  },
  {
    title: UI_MESSAGES.COMMON.MY_CONTAINER_REQUESTS + " " + UI_MESSAGES.COMMON.LISTING,
    href: "/customer/requests",
    icon: ListChecks,
  },
  { title: UI_MESSAGES.TITLES.STUFFING_DESTUFFING, href: "/customer/stuffing", icon: Package },
  { title: UI_MESSAGES.TITLES.TRANSIT_TRACKING, href: "/customer/transit", icon: Navigation },
  // { title: "Movements", href: "/customer/movements", icon: Truck },
  { title: UI_MESSAGES.BILLING.BILLS, href: "/customer/bills", icon: Receipt },
  { title: UI_MESSAGES.TITLES.PDA_VIEW, href: "/customer/pda", icon: FileText },
  { title: UI_MESSAGES.TITLES.PROFILE, href: "/customer/profile", icon: UserCircle },
];
