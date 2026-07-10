import { cn } from '@/lib/utils';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  disabled?: boolean;
  "data-testid"?: string;
}

export const PaginationButton = ({
  children,
  className = '',
  isActive = false,
  disabled = false,
  "data-testid": dataTestId,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'border w-10 h-10 rounded-sm label-md flex items-center justify-center hover:bg-component-hover cursor-pointer',
        isActive && 'border-primary',
        disabled &&
          'border text-disabled bg-primary hover:bg-primary cursor-default',
        className
      )}
      disabled={disabled}
      data-testid={dataTestId ?? 'pagination-button'}
      {...props}
    >
      {children}
    </button>
  );
};
