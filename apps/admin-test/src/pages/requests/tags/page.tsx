import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import { Container, Heading } from "@medusajs/ui";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";

export const config: RouteConfig = {
  label: "Tags",
  nested: "/requests",
};

import { useRequests } from "../../../hooks/api/requests";
import { useRequestTableColumns } from "../../../hooks/table/columns/use-request-table-columns";
import { useRequestTableQuery } from "../../../hooks/table/query/use-request-table-query";
import { useRequestTableFilters } from "../../../hooks/table/filters/use-request-table-filters";
import {
  _DataTable,
  SingleColumnPage,
  useDataTable,
} from "@mercurjs/dashboard-shared";

const PAGE_SIZE = 10;

const TagRequestsPage = () => {
  const { t } = useTranslation();
  const { raw, searchParams } = useRequestTableQuery({ pageSize: PAGE_SIZE });

  const { requests, count, isError, error, isLoading } = useRequests(
    "product_tag",
    searchParams,
    { placeholderData: keepPreviousData },
  );

  const columns = useRequestTableColumns();
  const filters = useRequestTableFilters();

  const { table } = useDataTable({
    data: requests ?? [],
    columns,
    enablePagination: true,
    count: count,
    pageSize: PAGE_SIZE,
  });

  if (isError) throw error;

  return (
    <SingleColumnPage>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Tag Requests</Heading>
        </div>
        <_DataTable
          columns={columns}
          table={table}
          pagination
          filters={filters}
          navigateTo={(row) => `/requests/product_tag/${row.original.id}`}
          count={count}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          orderBy={[
            { key: "created_at", label: t("fields.createdAt") },
            { key: "updated_at", label: t("fields.updatedAt") },
          ]}
          queryObject={raw}
          noRecords={{ message: "No tag requests found" }}
        />
      </Container>
    </SingleColumnPage>
  );
};

export default TagRequestsPage;
