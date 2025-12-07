import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number;
}

export const SidebarNavItem = ({
  to,
  icon: Icon,
  label,
  badge,
}: SidebarNavItemProps) => {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors-fast",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive
          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
          : "text-gray-700 dark:text-gray-300"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

interface SidebarNavGroupProps {
  title: string;
  children: React.ReactNode;
}

export const SidebarNavGroup = ({ title, children }: SidebarNavGroupProps) => {
  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

interface SidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export const Sidebar = ({ children, isOpen }: SidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 flex flex-col w-64",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      {children}
    </aside>
  );
};

export const SidebarHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
      {children}
    </div>
  );
};

export const SidebarContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">{children}</div>
  );
};

export const SidebarFooter = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4">
      {children}
    </div>
  );
};
