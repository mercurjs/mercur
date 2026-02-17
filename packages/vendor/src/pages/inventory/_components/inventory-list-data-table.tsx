import { InventoryTypes } from "@medusajs/types";

import { RowSelectionState } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { _DataTable } from "@components/table/data-table";
import { useInventoryItems } from "@hooks/api/inventory";
import { useDataTable } from "@hooks/use-data-table";
import { INVENTORY_ITEM_IDS_KEY } from "../common/constants";
import { useInventoryTableColumns } from "./use-inventory-table-columns";
import { useInventoryTableFilters } from "./use-inventory-table-filters";
import { useInventoryTableQuery } from "./use-inventory-table-query";
import { keepPreviousData } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export const InventoryListDataTable = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selection, setSelection] = useState<RowSelectionState>({});

  const { raw, searchParams } = useInventoryTableQuery({
    pageSize: PAGE_SIZE,
  });

  const {
    inventory_items,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItems(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const filters = useInventoryTableFilters();
  const columns = useInventoryTableColumns();

  const { table } = useDataTable({
    data: (inventory_items ?? []) as InventoryTypes.InventoryItemDTO[],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: true,
    rowSelection: {
      state: selection,
      updater: setSelection,
    },
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      isLoading={isLoading}
      pagination
      search
      filters={filters}
      queryObject={raw}
      orderBy={[
        { key: "title", label: t("fields.title") },
        { key: "sku", label: t("fields.sku") },
        { key: "stocked_quantity", label: t("fields.inStock") },
        { key: "reserved_quantity", label: t("inventory.reserved") },
      ]}
      navigateTo={(row) => `${row.id}`}
      commands={[
        {
          action: async (selection) => {
            navigate(
              `stock?${INVENTORY_ITEM_IDS_KEY}=${Object.keys(selection).join(
                ",",
              )}`,
            );
          },
          label: t("inventory.stock.action"),
          shortcut: "i",
        },
      ]}
    />
  );
};
