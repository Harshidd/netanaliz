import React from 'react'
import { cn } from '@/lib/utils'

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        // Base styles
        'flex w-full rounded-xl border bg-white px-4 py-3',
        'text-base text-gray-900',
        // Border
        'border-gray-300',
        // Appearance
        'appearance-none cursor-pointer',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2386868b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")]',
        'bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat',
        'pr-10',
        // Transitions
        'transition-all duration-200',
        // Focus state
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
        // Hover state
        'hover:border-gray-400',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-gray-50',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = 'Select'

export { Select }
