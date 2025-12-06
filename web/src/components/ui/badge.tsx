import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors-fast",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
        secondary:
          "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        success:
          "border-transparent bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300",
        warning:
          "border-transparent bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300",
        error:
          "border-transparent bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300",
        info: "border-transparent bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300",
        outline:
          "border-gray-300 bg-transparent text-gray-700 dark:border-gray-600 dark:text-gray-300",
        // Batch status variants
        "not-started":
          "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        "in-progress":
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        submitted:
          "border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        "in-transit":
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        "with-lecturer":
          "border-transparent bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        "under-grading":
          "border-transparent bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        graded:
          "border-transparent bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        returned:
          "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        completed:
          "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        archived:
          "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
