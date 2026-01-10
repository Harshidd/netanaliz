import React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base styles
        'flex w-full rounded-xl border bg-white px-4 py-3',
        'text-base text-gray-900 placeholder:text-gray-400',
        // Border
        'border-gray-300',
        // Transitions
        'transition-all duration-200',
        // Focus state
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
        // Hover state
        'hover:border-gray-400',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-gray-50',
        // File input
        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export { Input }
