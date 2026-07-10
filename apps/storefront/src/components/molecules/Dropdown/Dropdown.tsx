export const Dropdown = ({
  children,
  show,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  show: boolean;
  "data-testid"?: string;
}) => {
  if (!show) return null;

  return (
    <div
      className='absolute -right-2 bg-primary text-primary z-20 border border-primary rounded-sm w-max'
      data-testid={dataTestId ?? 'dropdown'}
    >
      {children}
    </div>
  );
};
