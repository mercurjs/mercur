export const Label = ({
  children,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  "data-testid"?: string;
}) => {
  return (
    <span
      className='border rounded-sm py-2 px-3 label-sm'
      data-testid={dataTestId ?? 'label'}
    >
      {children}
    </span>
  );
};
