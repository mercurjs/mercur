import { _DataTable } from "@components/table/data-table";
import { useInventoryItemLevels } from "@hooks/api/inventory";
import { useDataTable } from "@hooks/use-data-table";
import { useLocationListTableColumns } from "./use-location-list-table-columns";
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
  const columns = useLocationListTableColumns();

  const filteredLocationLevels = inventory_levels?.filter(
    (level) =>
      (level as unknown as { stock_locations: StockLocationDTO[] })
        .stock_locations.length > 0,
  );

  const { table } = useDataTable({
    data: filteredLocationLevels ?? [],
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
