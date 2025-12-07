import { useState } from "react";
import { Outlet } from "react-router";
import { useAuthStore } from "@/store/auth";
import { useLogout } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNavGroup,
  SidebarNavItem,
} from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  PackageSearch,
  Settings,
  Shield,
  BarChart3,
  FileText,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.isSuperAdmin || user?.role === "ADMIN";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen}>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-600 dark:bg-primary-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Exam Script
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Tracking System
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarNavGroup title="Main">
            <SidebarNavItem
              to="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
            />
            <SidebarNavItem
              to="/dashboard/sessions"
              icon={Calendar}
              label="My Sessions"
            />
            <SidebarNavItem
              to="/dashboard/students"
              icon={Users}
              label="Students"
            />
            <SidebarNavItem
              to="/dashboard/exam-sessions"
              icon={BookOpen}
              label="Exam Sessions"
            />
            <SidebarNavItem
              to="/dashboard/batch-tracking"
              icon={PackageSearch}
              label="Batch Tracking"
            />
          </SidebarNavGroup>

          {isAdmin && (
            <SidebarNavGroup title="Administration">
              <SidebarNavItem
                to="/dashboard/users"
                icon={Shield}
                label="User Management"
              />
              <SidebarNavItem
                to="/dashboard/analytics"
                icon={BarChart3}
                label="Analytics"
              />
              <SidebarNavItem
                to="/dashboard/audit-logs"
                icon={FileText}
                label="Audit Logs"
              />
            </SidebarNavGroup>
          )}

          <SidebarNavGroup title="Preferences">
            <SidebarNavItem
              to="/dashboard/settings"
              icon={Settings}
              label="Settings"
            />
          </SidebarNavGroup>
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-xs font-semibold">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role.replace("_", " ").toLowerCase()}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main content */}
      <div className="h-screen flex flex-col lg:pl-64">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)}>
          <ThemeToggle />
          <NotificationCenter />
        </TopBar>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
