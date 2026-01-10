import React from 'react'
import { cn } from '@/lib/utils'

const Alert = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: 'bg-gray-50 text-gray-800 border-gray-200',
    destructive: 'bg-red-50 text-red-800 border-red-200 [&>svg]:text-red-500',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 [&>svg]:text-amber-500',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 [&>svg]:text-emerald-500',
    info: 'bg-blue-50 text-blue-800 border-blue-200 [&>svg]:text-blue-500',
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-2xl border p-4',
        'transition-all duration-200',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})

Alert.displayName = 'Alert'

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm leading-relaxed [&_p]:leading-relaxed', className)}
    {...props}
  />
))

AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription }
