import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import { Container, Heading } from "@medusajs/ui";

import { _DataTable, SingleColumnPage } from "@mercurjs/dashboard-shared";
import { useDataTable } from "@mercurjs/dashboard-shared";
import { useReviews } from "../../hooks/api/reviews";
import { useReviewTableColumns } from "../../hooks/table/columns/use-review-table-columns";
import { useReviewTableQuery } from "../../hooks/table/query/use-review-table-query";
import { useReviewTableFilters } from "../../hooks/table/filters/use-review-table-filters";

const PAGE_SIZE = 10;

export const ReviewListPage = () => {
  const { t } = useTranslation();
  const { raw, searchParams } = useReviewTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { reviews, count, isError, error, isLoading } = useReviews(
    searchParams,
    {
      placeholderData: keepPreviousData,
    },
  );

  const columns = useReviewTableColumns();
  const filters = useReviewTableFilters();

  const { table } = useDataTable({
    data: reviews ?? [],
    columns,
    enablePagination: true,
    count: count,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Reviews</Heading>
        </div>
        <_DataTable
          columns={columns}
          table={table}
          pagination
          filters={filters}
          navigateTo={(row) => `/reviews/${row.original.id}`}
          count={count}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          orderBy={[
            {
              key: "created_at",
              label: t("fields.createdAt"),
            },
            {
              key: "updated_at",
              label: t("fields.updatedAt"),
            },
          ]}
          queryObject={raw}
          noRecords={{
            message: "No reviews found",
          }}
        />
      </Container>
    </SingleColumnPage>
  );
};
