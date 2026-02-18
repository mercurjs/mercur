import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge, Text } from "@medusajs/ui";
import { DateCell, DateHeader } from "@mercurjs/dashboard-shared";
import { ReviewDTO } from "../../api/reviews";

const columnHelper = createColumnHelper<ReviewDTO>();

const ratingColor = (rating: number) => {
  if (rating >= 4) return "green" as const;
  if (rating >= 3) return "orange" as const;
  return "red" as const;
};

export const useReviewTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("rating", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Rating</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const rating = getValue();
          return (
            <StatusBadge color={ratingColor(rating)}>{rating} / 5</StatusBadge>
          );
        },
      }),
      columnHelper.accessor("reference", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Reference</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const reference = getValue();
          return (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {reference.charAt(0).toUpperCase() + reference.slice(1)}
            </Text>
          );
        },
      }),
      columnHelper.accessor("customer_note", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Customer Note</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const note = getValue();
          return (
            <div className="flex h-full w-full items-center overflow-hidden">
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle truncate"
              >
                {note || "-"}
              </Text>
            </div>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return <DateCell date={date} />;
        },
      }),
    ],
    [t],
  );
};
