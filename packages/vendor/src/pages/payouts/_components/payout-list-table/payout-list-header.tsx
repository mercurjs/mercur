import { Children, ReactNode } from "react";
import { Heading } from "@medusajs/ui";

export const PayoutListTitle = () => {
  return <Heading>Payouts</Heading>;
};

export const PayoutListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? children : null}
    </div>
  );
};

export const PayoutListHeader = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <PayoutListTitle />
      )}
    </div>
  );
};
