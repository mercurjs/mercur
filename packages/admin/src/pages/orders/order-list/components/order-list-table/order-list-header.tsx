import { ReactNode, Children } from "react";
import { useTranslation } from "react-i18next";
import { Button, Heading } from "@medusajs/ui";

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

type OrderListExpandCollapseActionsProps = {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  disabled?: boolean;
};

export const OrderListExpandCollapseActions = ({
  onExpandAll,
  onCollapseAll,
  disabled = false,
}: OrderListExpandCollapseActionsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="small"
        disabled={disabled}
        onClick={onExpandAll}
        data-testid="orders-expand-all-button"
      >
        {t("actions.expandAll")}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="small"
        disabled={disabled}
        onClick={onCollapseAll}
        data-testid="orders-collapse-all-button"
      >
        {t("actions.collapseAll")}
      </Button>
    </>
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
