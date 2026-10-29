import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-mono font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-accent",
  {
    variants: {
      variant: {
        default:
          "border-border bg-raised text-text",
        secondary:
          "border-border bg-surface text-muted",
        destructive:
          "border-crit/50 bg-crit/15 text-crit font-semibold",
        outline:
          "border-border text-text bg-transparent",
        nominal:
          "border-border bg-raised text-muted font-normal",
        success:
          "border-border bg-raised text-text font-normal",
        warning:
          "border-warn/40 bg-warn/15 text-warn font-semibold",
        critical:
          "border-crit/40 bg-crit/15 text-crit font-bold",
        sensorFault:
          "border-sensor-fault/40 bg-sensor-fault/15 text-sensor-fault font-semibold",
        scada:
          "border-accent/40 bg-accent/15 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
