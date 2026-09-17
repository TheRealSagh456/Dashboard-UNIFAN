import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

type DataTableSurfaceProps = ComponentProps<"div"> & {
  contentClassName?: string;
  embedded?: boolean;
  footer?: ReactNode;
  scrollable?: boolean;
};

export function DataTableSurface({
  children,
  className,
  contentClassName,
  embedded = false,
  footer,
  scrollable = true,
  ...props
}: DataTableSurfaceProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-paper",
        !embedded && "rounded-2xl border border-line",
        footer && "pb-10",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          scrollable ? "overflow-x-auto" : "overflow-hidden",
          contentClassName,
        )}
      >
        {children}
      </div>
      {footer}
    </div>
  );
}
