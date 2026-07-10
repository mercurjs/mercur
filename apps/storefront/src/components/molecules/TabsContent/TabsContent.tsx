export const TabsContent = ({
  children,
  value,
  activeTab,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  value: string;
  activeTab: string;
  "data-testid"?: string;
}) => {
  if (activeTab !== value) return null;

  return <div data-testid={dataTestId ?? 'tabs-content'}>{children}</div>;
};
