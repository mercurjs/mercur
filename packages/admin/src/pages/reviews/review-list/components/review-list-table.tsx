import { PencilSquare, Star, Trash } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { Children, ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { _DataTable } from "../../../../components/table/data-table"
import { StatusCell } from "../../../../components/table/table-cells/common/status-cell"
import { DateCell } from "../../../../components/table/table-cells/common/date-cell"
import { useDataTable } from "../../../../hooks/use-data-table"
import { AdminReview, useReviews } from "../../../../hooks/api/reviews"
import { useDeleteReviewAction } from "../../common/hooks/use-delete-review-action"
import { getReviewStatusColor, StarRating } from "../../common/utils"
import { useReviewTableFilters } from "../use-review-table-filters"
import { useReviewTableQuery } from "../use-review-table-query"

const PAGE_SIZE = 20

export const ReviewListTitle = () => {
  const { t } = useTranslation()
  return (
    <Heading level="h2" data-testid="review-list-table-heading">
      {t("reviews.domain")}
    </Heading>
  )
}

export const ReviewListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="review-list-table-header"
    >
      {Children.count(children) > 0 ? children : <ReviewListTitle />}
    </div>
  )
}

const ReviewActions = ({ review }: { review: AdminReview }) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteReviewAction(review.id)

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/reviews/${review.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
      data-testid={`review-list-table-action-menu-${review.id}`}
    />
  )
}

const columnHelper = createColumnHelper<AdminReview>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: t("reviews.fields.id"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            #{getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("rating", {
        header: t("reviews.fields.rating"),
        cell: ({ getValue }) => <StarRating rating={getValue()} />,
      }),
      columnHelper.accessor("customer_note", {
        header: t("reviews.fields.content"),
        cell: ({ getValue }) => (
          <div className="w-[240px]">
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle line-clamp-3"
            >
              {getValue() || "-"}
            </Text>
          </div>
        ),
      }),
      columnHelper.accessor("seller", {
        header: t("reviews.fields.store"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            {getValue()?.name || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("customer", {
        header: t("reviews.fields.customer"),
        cell: ({ getValue }) => {
          const customer = getValue()
          const name = customer
            ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
            : ""
          return (
            <Text size="small" leading="compact" className="truncate">
              {name || "-"}
            </Text>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: t("reviews.fields.date"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("status", {
        header: t("reviews.fields.status"),
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <StatusCell color={getReviewStatusColor(status)}>
              {t(`reviews.status.${status}`)}
            </StatusCell>
          )
        },
      }),
      columnHelper.accessor("seller_note", {
        header: t("reviews.fields.response"),
        cell: ({ getValue }) => (
          <div className="w-[240px]">
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle line-clamp-3"
            >
              {getValue() || "-"}
            </Text>
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <ReviewActions review={row.original} />,
      }),
    ],
    [t]
  )
}

export const ReviewListDataTable = () => {
  const { t } = useTranslation()
  const { raw, searchParams } = useReviewTableQuery({ pageSize: PAGE_SIZE })
  const filters = useReviewTableFilters()

  const { reviews, count, isPending, isError, error } = useReviews(
    searchParams,
    { placeholderData: keepPreviousData }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: reviews ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
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
      navigateTo={(row) => row.id}
      isLoading={isPending}
      queryObject={raw}
      defaultOrder="-created_at"
      orderBy={[
        { key: "display_id", label: t("reviews.fields.id") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      noRecords={{
        title: t("reviews.list.noRecordsTitle"),
        message: t("reviews.list.noRecordsMessage"),
        icon: <Star />,
      }}
      noResults={{
        icon: <Star />,
      }}
      data-testid="review-list-table"
    />
  )
}

export const ReviewListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container
      className="divide-y p-0"
      data-testid="review-list-table-container"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ReviewListHeader />
          <ReviewListDataTable />
        </>
      )}
    </Container>
  )
}
