import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "../common/Breadcrumb";
import type { NavItem, Notification } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import {
  fetchNotifications,
  addNotification,
} from "@/store/slices/notificationSlice";

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  pageTitle?: ReactNode;
  pageActions?: ReactNode;
}

function DashboardLayout({
  children,
  navItems,
  pageTitle,
  pageActions,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  // Handle real-time notifications
  const handleSocketEvent = useCallback(
    (event: string, data: unknown) => {
      if (event === "notification") {
        dispatch(addNotification(data as Notification));
      }
    },
    [dispatch],
  );

  const { emit } = useSocket(handleSocketEvent);

  // Join user-specific room for notifications
  useEffect(() => {
    if (user && user.id) {
      emit("join", user.id);
    }
  }, [user, emit]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex">
        <Sidebar
          items={navItems}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-6">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4" />

            {/* Page Header */}
            {(pageTitle || pageActions) && (
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {pageTitle && (
                  <h1 className="text-2xl font-bold text-foreground">
                    {pageTitle}
                  </h1>
                )}
                {pageActions && (
                  <div className="flex items-center gap-3">{pageActions}</div>
                )}
              </div>
            )}

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
