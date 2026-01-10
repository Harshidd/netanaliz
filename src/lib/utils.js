import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}

export function calculateSuccessRate(score, maxScore) {
  if (maxScore === 0) return 0
  return (score / maxScore) * 100
}

