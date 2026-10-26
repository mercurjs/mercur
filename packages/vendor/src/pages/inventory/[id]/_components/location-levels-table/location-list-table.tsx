import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useExtendableTable } from "@mercurjs/dashboard-shared";
import { _DataTable } from "@components/table/data-table";
import { useInventoryItemLevels } from "@hooks/api/inventory";
import { useDataTable } from "@hooks/use-data-table";
import {
  ExtendedLocationLevel,
  useLocationListTableColumns,
} from "./use-location-list-table-columns";
import { useLocationLevelTableQuery } from "./use-location-list-table-query";
import { StockLocationDTO } from "@medusajs/types";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 20;

export const ItemLocationListTable = ({
  inventory_item_id,
}: {
  inventory_item_id: string;
}) => {
  const { t } = useTranslation();
  const { searchParams, raw } = useLocationLevelTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { inventory_levels, count, isLoading } = useInventoryItemLevels(
    inventory_item_id,
    {
      ...searchParams,
      fields: "*stock_locations",
    },
  );
  const baseColumns = useLocationListTableColumns();
  const actionsColumn = baseColumns[baseColumns.length - 1];
  const { columns: extended } = useExtendableTable<ExtendedLocationLevel>({
    model: "inventory_item",
    zone: "location-levels",
    columns: baseColumns.slice(0, -1) as unknown as ColumnDef<ExtendedLocationLevel, unknown>[],
  });
  const columns = useMemo(
    () => [...extended, actionsColumn] as ColumnDef<ExtendedLocationLevel, unknown>[],
    [extended, actionsColumn],
  );

  const filteredLocationLevels = inventory_levels?.filter(
    (level) =>
      (level as unknown as { stock_locations: StockLocationDTO[] })
        .stock_locations.length > 0,
  );

  const { table } = useDataTable({
    data: (filteredLocationLevels ?? []) as ExtendedLocationLevel[],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={filteredLocationLevels?.length}
      isLoading={isLoading}
      pagination
      queryObject={raw}
      noRecords={{
        title: t("inventory.locations.noRecordsTitle"),
        message: t("inventory.locations.noRecordsMessage"),
      }}
    />
  );
};
