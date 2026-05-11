import { Children, ReactNode } from "react";
import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

export const PayoutListTitle = () => {
  const { t } = useTranslation();
  return <Heading>{t("payouts.domain")}</Heading>;
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
