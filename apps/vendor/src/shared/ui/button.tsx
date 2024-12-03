import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib'

const buttonVariants = cva(
  'transition-fg inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-none disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-ui-button-inverted text-ui-fg-on-color hover:bg-ui-button-inverted-hover',
        outline: 'border bg-ui-button-neutral hover:bg-ui-button-neutral-hover',
        secondary:
          'bg-ui-bg-subtle text-ui-fg-base hover:bg-ui-bg-subtle-hover',
        ghost: 'bg-ui-button-neutral hover:bg-ui-button-neutral-hover',
        destructive:
          'bg-ui-button-danger text-ui-fg-on-color hover:bg-ui-button-danger-hover',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-3 py-2.5',
        sm: 'h-8 px-2.5',
        lg: 'h-12 px-4',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      icon,
      iconLeft: iconLeft_,
      iconRight,
      // TODO: add loading state
      loading,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    const iconLeft = iconLeft_ ?? icon

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {iconLeft && (
          <span className="size-4 text-ui-fg-muted">{iconLeft}</span>
        )}
        {icon && <span className="size-4 text-ui-fg-muted">{icon}</span>}
        {children}
        {iconRight && (
          <span className="size-4 text-ui-fg-muted">{iconRight}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
