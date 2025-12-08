import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-900 dark:[&>svg]:text-gray-100 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800",
        destructive:
          "border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 text-error-900 dark:text-error-100 [&>svg]:text-error-600 dark:[&>svg]:text-error-400",
        success:
          "border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 text-success-900 dark:text-success-100 [&>svg]:text-success-600 dark:[&>svg]:text-success-400",
        warning:
          "border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 text-warning-900 dark:text-warning-100 [&>svg]:text-warning-600 dark:[&>svg]:text-warning-400",
        info: "border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100 [&>svg]:text-primary-600 dark:[&>svg]:text-primary-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
