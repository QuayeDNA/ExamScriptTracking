import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const AuthLayout = ({
  title,
  description,
  children,
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-600 dark:bg-primary-500 shadow-lg mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Exam Script Tracking
          </h1>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {title}
            </CardTitle>
            <CardDescription className="text-center">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          © {new Date().getFullYear()} Exam Script Tracking System
        </p>
      </div>
    </div>
  );
};
