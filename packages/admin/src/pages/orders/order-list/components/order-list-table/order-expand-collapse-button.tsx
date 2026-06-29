import { ArrowsPointingOut, ArrowsReduceDiagonal } from "@medusajs/icons";
import { IconButton, Tooltip } from "@medusajs/ui";
import { Table } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

import { OrderGroupRow } from "./order-list-data-table";

export const OrderExpandCollapseButton = ({
  table,
}: {
  table: Table<OrderGroupRow>;
}) => {
  const { t } = useTranslation();
  const allExpanded = table.getIsAllRowsExpanded();

  return (
    <Tooltip
      content={t(
        allExpanded ? "orders.list.collapseAll" : "orders.list.expandAll",
      )}
    >
      <IconButton
        size="small"
        type="button"
        onClick={() => table.toggleAllRowsExpanded()}
        data-testid="orders-expand-collapse-all"
      >
        {allExpanded ? <ArrowsReduceDiagonal /> : <ArrowsPointingOut />}
      </IconButton>
    </Tooltip>
  );
};
