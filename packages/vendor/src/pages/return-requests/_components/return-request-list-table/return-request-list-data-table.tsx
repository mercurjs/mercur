import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import { ArrowUturnLeft } from "@medusajs/icons";

import { _DataTable, useDataTable } from "@mercurjs/dashboard-shared";

import { useReturnRequests } from "@hooks/api/return-requests";
import { useReturnRequestTableColumns } from "./use-return-request-table-columns";
import { useReturnRequestTableQuery } from "./use-return-request-table-query";
import { useReturnRequestTableFilters } from "./use-return-request-table-filters";

const PAGE_SIZE = 20;

export const ReturnRequestListDataTable = () => {
  const { t } = useTranslation();
  const { raw, searchParams } = useReturnRequestTableQuery({
    pageSize: PAGE_SIZE,
  });

  const {
    return_requests: returnRequests,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useReturnRequests(searchParams, {
    placeholderData: keepPreviousData,
  });

  const columns = useReturnRequestTableColumns();
  const filters = useReturnRequestTableFilters();

  const { table } = useDataTable({
    data: returnRequests ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count}
      pageSize={PAGE_SIZE}
      pagination
      filters={filters}
      navigateTo={(row) => `/return-requests/${row.original.id}`}
      isLoading={isLoading}
      queryObject={raw}
      orderBy={[
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      noRecords={{
        title: t("returnRequests.list.noRecordsTitle"),
        message: t("returnRequests.list.noRecordsMessage"),
        icon: <ArrowUturnLeft className="text-ui-fg-subtle" />,
      }}
      noResults={{
        title: t("returnRequests.list.noResultsTitle"),
        message: t("returnRequests.list.noResultsMessage"),
        icon: <ArrowUturnLeft className="text-ui-fg-subtle" />,
      }}
    />
  );
};
