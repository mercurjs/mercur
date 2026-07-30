import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import { Star } from "@medusajs/icons";

import { _DataTable, useDataTable } from "@mercurjs/dashboard-shared";

import { useReviews } from "@hooks/api/reviews";
import { useReviewTableColumns } from "./use-review-table-columns";
import { useReviewTableQuery } from "./use-review-table-query";
import { useReviewTableFilters } from "./use-review-table-filters";

const PAGE_SIZE = 20;

export const ReviewListDataTable = () => {
  const { t } = useTranslation();
  const { raw, searchParams } = useReviewTableQuery({ pageSize: PAGE_SIZE });

  const { reviews, count, isPending: isLoading, isError, error } = useReviews(
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
      search
      filters={filters}
      navigateTo={(row) => `/reviews/${row.original.id}`}
      isLoading={isLoading}
      queryObject={raw}
      orderBy={[
        { key: "display_id", label: t("reviews.list.columns.reviewId") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      noRecords={{
        title: t("reviews.list.noRecordsTitle"),
        message: t("reviews.list.noRecordsMessage"),
        icon: <Star className="text-ui-fg-subtle" />,
      }}
      noResults={{
        title: t("reviews.list.noResultsTitle"),
        message: t("reviews.list.noResultsMessage"),
        icon: <Star className="text-ui-fg-subtle" />,
      }}
    />
  );
};
