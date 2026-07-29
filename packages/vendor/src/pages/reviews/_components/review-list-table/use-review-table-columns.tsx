import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge, Text } from "@medusajs/ui";
import { ChatBubbleLeftRight, Flag } from "@medusajs/icons";
import { DateCell, DateHeader } from "@mercurjs/dashboard-shared";

import { ActionMenu } from "@components/common/action-menu";
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
      columnHelper.accessor("id", {
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
          <div className="flex h-full w-full items-center overflow-hidden">
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle truncate"
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
        header: () => <DateHeader />,
        cell: ({ getValue }) => <DateCell date={new Date(getValue())} />,
      }),
      columnHelper.accessor("status", {
        header: () => <span>{t("reviews.list.columns.status")}</span>,
        cell: ({ getValue }) => {
          const { color, label } = getReviewStatusProps(getValue(), t);
          return <StatusBadge color={color}>{label}</StatusBadge>;
        },
      }),
      columnHelper.accessor("seller_note", {
        header: () => <span>{t("reviews.list.columns.response")}</span>,
        cell: ({ getValue }) => (
          <div className="flex h-full w-full items-center overflow-hidden">
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle truncate"
            >
              {getValue() || "-"}
            </Text>
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const review = row.original;
          const hasResponse = Boolean(review.seller_note);
          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      icon: <ChatBubbleLeftRight />,
                      label: t("reviews.respond.action"),
                      to: `/reviews/${review.id}/respond`,
                      disabled: hasResponse,
                      disabledTooltip: t("reviews.respond.alreadyResponded"),
                    },
                    {
                      icon: <Flag />,
                      label: t("reviews.report.action"),
                      to: `/reviews/${review.id}/report`,
                    },
                  ],
                },
              ]}
            />
          );
        },
      }),
    ],
    [t],
  );
};
