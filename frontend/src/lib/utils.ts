import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = "ZAR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(num)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatPercentage(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return `${num.toFixed(1)}%`
}
