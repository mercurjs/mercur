import { cn } from '@/shared/lib'
import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'cva'
import * as React from 'react'

const textVariants = cva({
  variants: {
    size: {
      xsmall: 'text-[13px] leading-[18px]',
      small: 'text-sm leading-5',
      base: 'text-base leading-6',
      large: 'text-lg leading-7',
      xlarge: 'text-xl leading-8',
      '2xlarge': 'text-2xl leading-9'
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

const Typography = React.forwardRef<HTMLParagraphElement, TextProps>(
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
Typography.displayName = 'Typography'

export { Typography }
