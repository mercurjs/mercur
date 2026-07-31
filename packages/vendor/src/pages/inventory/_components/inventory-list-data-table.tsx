import { InventoryTypes } from "@medusajs/types";
import { Buildings } from "@medusajs/icons";

import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
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
      ...useLinkQuery(
        "inventory_item",
        "+offers.product_variant.product.title",
      ),
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const baseFilters = useInventoryTableFilters();
  const baseColumns = useInventoryTableColumns();
  const actionsColumn = baseColumns[baseColumns.length - 1];
  const { columns: extended, filters: extFilters } =
    useExtendableTable<InventoryTypes.InventoryItemDTO>({
      model: "inventory_item",
      columns: baseColumns.slice(0, -1) as unknown as ColumnDef<
        InventoryTypes.InventoryItemDTO,
        unknown
      >[],
    });
  const columns = useMemo(
    () => [...extended, actionsColumn],
    [extended, actionsColumn],
  );
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters],
  );

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
      defaultOrder="title"
      noRecords={{
        icon: <Buildings className="text-ui-fg-subtle" />,
        title: t("inventory.list.noRecordsTitle"),
        message: t("inventory.list.noRecordsMessage"),
        action: { to: "create", label: t("actions.create") },
      }}
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
