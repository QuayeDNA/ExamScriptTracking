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
            "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-gray-800 group-[.toaster]:text-gray-900 group-[.toaster]:dark:text-gray-100 group-[.toaster]:border-gray-200 group-[.toaster]:dark:border-gray-700 group-[.toaster]:shadow-lg",
          description:
            "group-[.toast]:text-gray-600 group-[.toast]:dark:text-gray-400",
          actionButton:
            "group-[.toast]:bg-primary-600 group-[.toast]:text-white group-[.toast]:hover:bg-primary-700",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:dark:bg-gray-700 group-[.toast]:text-gray-700 group-[.toast]:dark:text-gray-300",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
