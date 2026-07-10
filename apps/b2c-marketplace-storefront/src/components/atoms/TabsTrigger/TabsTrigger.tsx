import { cn } from '@/lib/utils';

export const TabsTrigger = ({
  children,
  isActive,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  isActive: boolean;
  "data-testid"?: string;
}) => {
  return (
    <p
      className={cn(
        'capitalize cursor-pointer px-2 pb-2',
        isActive && 'border-b border-primary font-bold'
      )}
      data-testid={dataTestId ?? 'tabs-trigger'}
    >
      {children}
    </p>
  );
};
