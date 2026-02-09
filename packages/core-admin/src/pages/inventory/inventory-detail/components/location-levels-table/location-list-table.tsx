import type { ExtendedInventoryItemLevel } from "@custom-types/inventory";

import { _DataTable } from "@components/table/data-table";

import { useInventoryItemLevels } from "@hooks/api";
import { useDataTable } from "@hooks/use-data-table";

import { useLocationListTableColumns } from "./use-location-list-table-columns";
import { useLocationLevelTableQuery } from "./use-location-list-table-query";

const PAGE_SIZE = 20;
const PREFIX = "invlvl";

export const ItemLocationListTable = ({
  inventory_item_id,
}: {
  inventory_item_id: string;
}) => {
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

  const columns = useLocationListTableColumns();

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
      />
    </div>
  );
};
