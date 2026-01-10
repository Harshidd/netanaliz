import React from 'react'
import { cn } from '@/lib/utils'

const Button = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children,
  ...props 
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2
    disabled:pointer-events-none disabled:opacity-40
    active:scale-[0.98]
  `

  const variantStyles = {
    default: `
      bg-primary text-white rounded-full
      hover:bg-primary-light hover:shadow-lg
    `,
    outline: `
      bg-white text-gray-700 border border-gray-300 rounded-full
      hover:bg-gray-50 hover:border-gray-400
    `,
    secondary: `
      bg-gray-100 text-gray-900 rounded-full
      hover:bg-gray-200
    `,
    ghost: `
      text-gray-600 rounded-lg
      hover:bg-gray-100 hover:text-gray-900
    `,
    destructive: `
      bg-destructive text-white rounded-full
      hover:bg-red-600
    `,
    success: `
      bg-success text-white rounded-full
      hover:bg-green-600
    `,
    link: `
      text-primary underline-offset-4
      hover:underline
    `,
  }

  const sizeStyles = {
    default: 'h-11 px-6 py-2.5 text-sm',
    sm: 'h-9 px-4 py-2 text-sm',
    lg: 'h-12 px-8 py-3 text-base',
    xl: 'h-14 px-10 py-4 text-lg',
    icon: 'h-10 w-10 rounded-full',
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export { Button }
