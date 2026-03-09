import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { keepPreviousData } from "@tanstack/react-query";
import { Button, Container, Heading } from "@medusajs/ui";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";

export const config: RouteConfig = {
  label: "Categories",
  nested: "/requests",
};

import { useVendorRequests } from "../../../hooks/api/requests";
import { useRequestTableColumns } from "../../../hooks/table/columns/use-request-table-columns";
import { useRequestTableQuery } from "../../../hooks/table/query/use-request-table-query";
import { useRequestTableFilters } from "../../../hooks/table/filters/use-request-table-filters";
import {
  _DataTable,
  SingleColumnPage,
  useDataTable,
} from "@mercurjs/dashboard-shared";

const PAGE_SIZE = 10;

const VendorCategoryRequestsPage = () => {
  const { t } = useTranslation();
  const { raw, searchParams } = useRequestTableQuery({ pageSize: PAGE_SIZE });

  const { requests, count, isError, error, isLoading } = useVendorRequests(
    "product_category",
    searchParams,
    { placeholderData: keepPreviousData },
  );

  const columns = useRequestTableColumns("name");
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
          <Heading>Category Requests</Heading>
          <Button size="small" variant="secondary" asChild>
            <Link to="create">{t("actions.create")}</Link>
          </Button>
        </div>
        <_DataTable
          columns={columns}
          table={table}
          pagination
          filters={filters}
          count={count}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          orderBy={[
            { key: "created_at", label: t("fields.createdAt") },
            { key: "updated_at", label: t("fields.updatedAt") },
          ]}
          queryObject={raw}
          noRecords={{ message: "No category requests found" }}
        />
      </Container>
    </SingleColumnPage>
  );
};

export default VendorCategoryRequestsPage;
