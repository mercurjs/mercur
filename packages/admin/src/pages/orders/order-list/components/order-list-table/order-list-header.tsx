import { ReactNode, Children } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowsPointingOut,
  ArrowsReduceDiagonal,
} from "@medusajs/icons";
import { Heading, IconButton, Tooltip } from "@medusajs/ui";

export const OrderListTitle = () => {
  const { t } = useTranslation();
  return <Heading data-testid="orders-heading">{t("orders.domain")}</Heading>;
};

export const OrderListActions = ({
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

type OrderListExpandCollapseActionProps = {
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export const OrderListExpandCollapseAction = ({
  expanded,
  onToggle,
  disabled = false,
}: OrderListExpandCollapseActionProps) => {
  const { t } = useTranslation();
  const label = expanded ? t("actions.collapseAll") : t("actions.expandAll");

  return (
    <Tooltip content={label}>
      <IconButton
        type="button"
        size="small"
        disabled={disabled}
        onClick={onToggle}
        aria-label={label}
        data-testid={
          expanded ? "orders-collapse-all-button" : "orders-expand-all-button"
        }
      >
        {expanded ? <ArrowsReduceDiagonal /> : <ArrowsPointingOut />}
      </IconButton>
    </Tooltip>
  );
};

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
      {Children.count(children) > 0 ? (
        children
      ) : (
        <OrderListTitle />
      )}
    </div>
  );
};
