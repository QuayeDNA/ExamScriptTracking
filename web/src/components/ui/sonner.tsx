import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { actualTheme } = useTheme();

  return (
    <Sonner
      theme={actualTheme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-800 dark:group-[.toaster]:text-gray-100 dark:group-[.toaster]:border-gray-700",
          description:
            "group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-primary-600 group-[.toast]:text-white dark:group-[.toast]:bg-primary-600",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 dark:group-[.toast]:bg-gray-700 dark:group-[.toast]:text-gray-200",
          success:
            "group-[.toast]:text-success-600 dark:group-[.toast]:text-success-400",
          error:
            "group-[.toast]:text-error-600 dark:group-[.toast]:text-error-400",
          warning:
            "group-[.toast]:text-warning-600 dark:group-[.toast]:text-warning-400",
          info: "group-[.toast]:text-info-600 dark:group-[.toast]:text-info-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
