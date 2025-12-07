import * as React from "react";
import { Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
  children?: React.ReactNode;
}

export const TopBar = ({ onMenuClick, children }: TopBarProps) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="h-full flex items-center gap-4 px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input type="search" placeholder="Search..." className="pl-10" />
          </div>
        </div>

        {/* Right side content */}
        <div className="flex items-center gap-2 ml-auto">{children}</div>
      </div>
    </header>
  );
};

export const TopBarActions = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex items-center gap-2">{children}</div>;
};
