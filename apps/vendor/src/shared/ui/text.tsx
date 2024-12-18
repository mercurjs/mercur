import { cn } from '@/shared/lib'
import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'cva'
import * as React from 'react'

const textVariants = cva({
  variants: {
    size: {
      xsmall: 'text-xs',
      small: 'text-sm',
      base: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl',
      '2xlarge': 'text-2xl'
    },
    weight: {
      regular: 'font-normal',
      plus: 'font-medium'
    }
  },
  defaultVariants: {
    size: 'small',
    weight: 'regular'
  }
})

export interface TextProps
  extends React.ComponentPropsWithoutRef<'p'>,
    VariantProps<typeof textVariants> {
  asChild?: boolean
  as?: string
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  (
    {
      className,
      asChild = false,
      as = 'p',
      size = 'small',
      weight = 'regular',
      children,
      ...props
    }: TextProps,
    ref
  ) => {
    const Component = asChild ? Slot : as

    return (
      <Component
        ref={ref}
        className={cn(textVariants({ size, weight }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Text.displayName = 'Text'

export { Text }
