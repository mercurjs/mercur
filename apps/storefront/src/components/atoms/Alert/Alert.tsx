import React from 'react';

import { AlertIcon } from '@/icons';
import { cn } from '@/lib/utils';

type AlertVariant = 'base' | 'base-inverse' | 'brand';

interface AlertProps {
  variant?: AlertVariant;
  icon?: React.ReactNode | boolean;
  title?: string;
  className?: string;
  "data-testid"?: string;
}

const variantStyles: Record<AlertVariant, { container: string; text: string; icon: string }> = {
  base: {
    container: 'bg-component-primary border border-primary',
    text: 'text-primary',
    icon: '#090909'
  },
  'base-inverse': {
    container: 'bg-tertiary border border-secondary',
    text: 'text-tertiary',
    icon: '#fff'
  },
  brand: {
    container: 'bg-action-secondary',
    text: 'text-action-on-secondary',
    icon: '#090909'
  }
};

export const Alert = ({ variant = 'base', icon, title, className, "data-testid": dataTestId }: AlertProps) => {
  const styles = variantStyles[variant];
  const iconOnly = icon && !title 

  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center justify-center gap-1 px-3 py-2 rounded-sm',
        styles.container,
        className,
        iconOnly && "p-2.5"
      )}
      data-testid={dataTestId ?? 'alert'}
    >
      {icon && (
        <div className="flex-shrink-0">
          {typeof icon === 'boolean' || icon === undefined ? (
            <AlertIcon
              color={styles.icon}
              size={16}
            />
          ) : (
            icon
          )}
        </div>
      )}
      {title && <p className={cn('label-sm', styles.text)}>{title}</p>}
    </div>
  );
};
