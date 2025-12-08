import { Outlet } from "react-router";
import { ThemeToggle } from "@/components/ThemeToggle";

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Auth page content */}
      <div className="w-full max-w-md">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Exam Script Tracking System
        </p>
      </div>
    </div>
  );
};
