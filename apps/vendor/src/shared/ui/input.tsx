import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib'

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        default: '',
        secondary: ''
      },
      size: {
        default: 'h-10',
        sm: 'h-8 text-sm',
        lg: 'h-12 text-lg'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
