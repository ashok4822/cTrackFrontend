import { useState } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "../common/Breadcrumb";
import type { NavItem } from "@/types";

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  pageTitle?: string;
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
