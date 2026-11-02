import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useExtendableTable } from "@mercurjs/dashboard-shared";
import type { ExtendedInventoryItemLevel } from "@custom-types/inventory";

import { _DataTable } from "@components/table/data-table";

import { useInventoryItemLevels } from "@hooks/api";
import { useDataTable } from "@hooks/use-data-table";

import { useLocationListTableColumns } from "./use-location-list-table-columns";
import { useLocationLevelTableQuery } from "./use-location-list-table-query";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 20;
const PREFIX = "invlvl";

export const ItemLocationListTable = ({
  inventory_item_id,
}: {
  inventory_item_id: string;
}) => {
  const { t } = useTranslation();
  const { searchParams, raw } = useLocationLevelTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const {
    inventory_levels,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItemLevels(inventory_item_id, {
    ...searchParams,
    fields: "+stock_locations.id,+stock_locations.name",
  });

  const baseColumns = useLocationListTableColumns();
  const actionsColumn = baseColumns[baseColumns.length - 1];
  const { columns: extended } = useExtendableTable<ExtendedInventoryItemLevel>({
    model: "inventory_item",
    zone: "location-levels",
    columns: baseColumns.slice(0, -1) as unknown as ColumnDef<ExtendedInventoryItemLevel, unknown>[],
  });
  const columns = useMemo(
    () => [...extended, actionsColumn] as ColumnDef<ExtendedInventoryItemLevel, unknown>[],
    [extended, actionsColumn],
  );

  if (isError) {
    throw error;
  }

  const { table } = useDataTable({
    data: (inventory_levels ?? []) as ExtendedInventoryItemLevel[],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  return (
    <div data-testid="inventory-location-levels-table">
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        isLoading={isLoading}
        pagination
        queryObject={raw}
        noRecords={{
          title: t("inventory.locations.noRecordsTitle"),
          message: t("inventory.locations.noRecordsMessage"),
        }}
      />
    </div>
  );
};
