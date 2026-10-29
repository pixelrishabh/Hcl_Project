import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[4px] text-xs font-mono font-medium border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default:
          "border-border bg-raised text-text hover:bg-surface active:bg-bg",
        destructive:
          "border-crit/50 bg-crit/15 text-crit hover:bg-crit/25",
        outline:
          "border-border bg-surface text-text hover:bg-raised active:bg-bg",
        secondary:
          "border-border bg-surface text-muted hover:text-text hover:bg-raised",
        ghost:
          "border-transparent bg-transparent text-muted hover:text-text hover:bg-surface",
        link:
          "border-transparent text-accent underline-offset-4 hover:underline p-0 h-auto",
        activeFault:
          "border-crit bg-crit/20 text-crit font-semibold",
        activeNormal:
          "border-border bg-raised text-text font-semibold",
        activeWarn:
          "border-warn bg-warn/20 text-warn font-semibold",
        activeSensorFault:
          "border-sensor-fault bg-sensor-fault/20 text-sensor-fault font-semibold",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 px-2.5 text-xs",
        lg: "h-9 px-4 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
