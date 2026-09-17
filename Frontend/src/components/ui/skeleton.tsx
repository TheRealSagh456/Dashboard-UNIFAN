import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const skeletonStyles = cva(
  "skeleton-shimmer relative isolate overflow-hidden bg-line/75",
  {
    variants: {
      variant: {
        text: "h-4 rounded-full",
        card: "min-h-40 rounded-2xl border border-line bg-paper/70 shadow-card",
      },
    },
    defaultVariants: {
      variant: "text",
    },
  },
);

type SkeletonProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof skeletonStyles>;

export function Skeleton({ variant, className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(skeletonStyles({ variant }), className)}
      {...props}
    />
  );
}
