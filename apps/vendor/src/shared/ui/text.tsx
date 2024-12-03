import { cn } from '@/shared/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'cva'
import * as React from 'react'

const textVariants = cva({
  variants: {
    size: {
      xsmall: '',
      small: '',
      base: '',
      large: '',
      xlarge: ''
    },
    weight: {
      regular: 'font-normal',
      plus: 'font-medium'
    },
    leading: {
      normal: '',
      compact: ''
    }
  },
  defaultVariants: {
    size: 'base',
    weight: 'regular',
    leading: 'normal'
  },
  compoundVariants: [
    {
      size: 'xsmall',
      leading: 'normal',
      className: 'txt-xsmall'
    },
    {
      size: 'xsmall',
      leading: 'compact',
      className: 'txt-compact-xsmall'
    },
    {
      size: 'small',
      leading: 'normal',
      className: 'txt-small'
    },
    {
      size: 'small',
      leading: 'compact',
      className: 'txt-compact-small'
    },
    {
      size: 'base',
      leading: 'normal',
      className: 'txt-medium'
    },
    {
      size: 'base',
      leading: 'compact',
      className: 'txt-compact-medium'
    },
    {
      size: 'large',
      leading: 'normal',
      className: 'txt-large'
    },
    {
      size: 'large',
      leading: 'compact',
      className: 'txt-compact-large'
    },
    {
      size: 'xlarge',
      leading: 'normal',
      className: 'txt-xlarge'
    },
    {
      size: 'xlarge',
      leading: 'compact',
      className: 'txt-compact-xlarge'
    }
  ]
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
      size = 'base',
      weight = 'regular',
      leading = 'normal',
      children,
      ...props
    }: TextProps,
    ref
  ) => {
    const Component = asChild ? Slot : as

    return (
      <Component
        ref={ref}
        className={cn(textVariants({ size, weight, leading }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Text.displayName = 'Text'

export { Text }
