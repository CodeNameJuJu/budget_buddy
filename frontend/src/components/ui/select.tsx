import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode
  value: string
}

export interface SelectValueProps extends React.SpanHTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          theme === "light"
            ? "border-[#E6E0D6] bg-white placeholder:text-[#6C7A73] focus-visible:ring-[#6BAF92]"
            : "border-[#2E3B35] bg-[#18231D] placeholder:text-[#A7B3AD] focus-visible:ring-[#6BAF92]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <button
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          theme === "light"
            ? "border-[#E6E0D6] bg-white placeholder:text-[#6C7A73] focus-visible:ring-[#6BAF92]"
            : "border-[#2E3B35] bg-[#18231D] placeholder:text-[#A7B3AD] focus-visible:ring-[#6BAF92]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <div
        className={cn(
          "relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
          theme === "light"
            ? "border-[#E6E0D6] bg-white text-[#1F2A24]"
            : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <option
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
          theme === "light"
            ? "focus:bg-[#E8DCC5] focus:text-[#1F2A24]"
            : "focus:bg-[#2E3B35] focus:text-[#E7EFEA]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </option>
    )
  }
)
SelectItem.displayName = "SelectItem"

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => {
    return (
      <span
        className={cn("block truncate", className)}
        ref={ref}
        {...props}
      >
        {placeholder}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
