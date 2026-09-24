import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-[#74B899] to-[#5E9C7E] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(94,156,126,0.35)] hover:from-[#7DBFA1] hover:to-[#65A587] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(94,156,126,0.45)]",
        destructive: "bg-gradient-to-b from-[#D48A6B] to-[#B46B52] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_14px_rgba(180,107,82,0.35)] hover:brightness-105",
        outline: "glass-input hover:border-[#6BAF92]/60",
        secondary: "glass-input bg-[#6BAF92]/20 text-foreground hover:bg-[#6BAF92]/30",
        ghost: "hover:bg-white/40 dark:hover:bg-white/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-xl px-8",
        icon: "h-9 w-9",
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
