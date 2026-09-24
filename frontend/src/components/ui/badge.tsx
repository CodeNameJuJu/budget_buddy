import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-white/30 bg-gradient-to-b from-[#74B899] to-[#5E9C7E] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-white/20 bg-gradient-to-b from-[#D48A6B] to-[#B46B52] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        outline: "glass-pill text-foreground",
        income: "border-transparent bg-[#6BAF92]/20 text-[#4A7A60] dark:bg-[#88B39B]/20 dark:text-[#88B39B]",
        expense: "border-transparent bg-red-100 text-[#DC2626] dark:bg-red-900/30 dark:text-red-300",
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
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
