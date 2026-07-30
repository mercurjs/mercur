import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@medusajs/ui";
import { DateCell } from "@mercurjs/dashboard-shared";

import { StatusCell } from "@components/table/table-cells/common/status-cell";
import type { ReviewDTO } from "@hooks/api/reviews";
import { StarRating, getReviewStatusProps } from "../../common/utils";

const columnHelper = createColumnHelper<ReviewDTO>();

const customerName = (customer?: ReviewDTO["customer"]) => {
  if (!customer) {
    return "-";
  }
  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ");
  return name || customer.email || "-";
};

export const useReviewTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <span>{t("reviews.list.columns.reviewId")}</span>,
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            #{getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("rating", {
        header: () => <span>{t("reviews.list.columns.rating")}</span>,
        cell: ({ getValue }) => <StarRating rating={getValue()} />,
      }),
      columnHelper.accessor("customer_note", {
        header: () => <span>{t("reviews.list.columns.content")}</span>,
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
      columnHelper.accessor("customer", {
        header: () => <span>{t("reviews.list.columns.customer")}</span>,
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            {customerName(getValue())}
          </Text>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: () => <span>{t("reviews.list.columns.date")}</span>,
        cell: ({ getValue }) => <DateCell date={new Date(getValue())} />,
      }),
      columnHelper.accessor("status", {
        header: () => <span>{t("reviews.list.columns.status")}</span>,
        cell: ({ getValue }) => {
          const { color, label } = getReviewStatusProps(getValue(), t);
          return <StatusCell color={color}>{label}</StatusCell>;
        },
      }),
      columnHelper.accessor("seller_note", {
        header: () => <span>{t("reviews.list.columns.response")}</span>,
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
    ],
    [t],
  );
};
