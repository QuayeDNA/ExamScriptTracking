import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner } from "sonner";
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { actualTheme } = useTheme();

  return (
    <Sonner
      theme={actualTheme}
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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          success:
            "group-[.toast]:bg-success-50 group-[.toast]:dark:bg-success-900/20 group-[.toast]:text-success-700 group-[.toast]:dark:text-success-400 group-[.toast]:border-success-200 group-[.toast]:dark:border-success-800",
          error:
            "group-[.toast]:bg-error-50 group-[.toast]:dark:bg-error-900/20 group-[.toast]:text-error-700 group-[.toast]:dark:text-error-400 group-[.toast]:border-error-200 group-[.toast]:dark:border-error-800",
          warning:
            "group-[.toast]:bg-warning-50 group-[.toast]:dark:bg-warning-900/20 group-[.toast]:text-warning-700 group-[.toast]:dark:text-warning-400 group-[.toast]:border-warning-200 group-[.toast]:dark:border-warning-800",
          info: "group-[.toast]:bg-info-50 group-[.toast]:dark:bg-info-900/20 group-[.toast]:text-info-700 group-[.toast]:dark:text-info-400 group-[.toast]:border-info-200 group-[.toast]:dark:border-info-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
