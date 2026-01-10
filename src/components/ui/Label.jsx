import React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef(({ className, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium text-gray-600 leading-none',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      className
    )}
    {...props}
  >
    {props.children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
))

Label.displayName = 'Label'

export { Label }
