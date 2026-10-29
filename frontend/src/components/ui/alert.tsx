import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-[4px] border px-3.5 py-2.5 text-xs font-mono [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3 [&>svg]:text-text [&>svg~*]:pl-6",
  {
    variants: {
      variant: {
        default: "border-border bg-surface text-text",
        destructive:
          "border-crit/50 bg-crit/10 text-crit [&>svg]:text-crit font-medium",
        warning:
          "border-warn/50 bg-warn/10 text-warn [&>svg]:text-warn font-medium",
        sensorFault:
          "border-sensor-fault/50 bg-sensor-fault/10 text-sensor-fault [&>svg]:text-sensor-fault font-medium",
        nominal:
          "border-border bg-raised text-text [&>svg]:text-muted",
        accent:
          "border-accent/40 bg-accent/10 text-accent [&>svg]:text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

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
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-wide text-xs uppercase", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-muted [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
