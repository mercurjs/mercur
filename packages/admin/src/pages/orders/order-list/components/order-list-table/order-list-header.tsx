import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Heading } from "@medusajs/ui";

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition";

export const OrderListTitle = () => {
  const { t } = useTranslation();
  return <Heading data-testid="orders-heading">{t("orders.domain")}</Heading>;
};

const ACTIONS_ALLOWED_TYPES = [] as const;

export const OrderListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {hasExplicitCompoundComposition(children, ACTIONS_ALLOWED_TYPES) ? children : null}
    </div>
  );
};

const HEADER_ALLOWED_TYPES = [OrderListTitle, OrderListActions] as const;

export const OrderListHeader = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="orders-header"
    >
      {hasExplicitCompoundComposition(children, HEADER_ALLOWED_TYPES) ? (
        children
      ) : (
        <OrderListTitle />
      )}
    </div>
  );
};
