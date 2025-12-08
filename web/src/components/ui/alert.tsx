import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-error-500/50 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 [&>svg]:text-error-600 dark:[&>svg]:text-error-400",
        success:
          "border-success-500/50 text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 [&>svg]:text-success-600 dark:[&>svg]:text-success-400",
        warning:
          "border-warning-500/50 text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 [&>svg]:text-warning-600 dark:[&>svg]:text-warning-400",
        info: "border-info-500/50 text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-900/20 [&>svg]:text-info-600 dark:[&>svg]:text-info-400",
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
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
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
