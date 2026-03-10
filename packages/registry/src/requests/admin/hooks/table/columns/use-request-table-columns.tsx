import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge, Text } from "@medusajs/ui";
import { DateCell, DateHeader } from "@mercurjs/dashboard-shared";
import { RequestDTO } from "../../api/requests";

const columnHelper = createColumnHelper<RequestDTO>();

const statusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "green" as const;
    case "pending":
      return "orange" as const;
    case "rejected":
      return "red" as const;
    default:
      return "grey" as const;
  }
};

export const useRequestTableColumns = (nameKey: string = "name") => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.display({
        id: "display_name",
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Name</span>
          </div>
        ),
        cell: ({ row }) => (
          <Text size="small" leading="compact">
            {(row.original[nameKey] as string) ?? row.original.id}
          </Text>
        ),
      }),
      columnHelper.accessor("custom_fields", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Status</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const customFields = getValue() as any;
          const status = customFields?.request_status ?? "draft";
          return (
            <StatusBadge color={statusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </StatusBadge>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return <DateCell date={date} />;
        },
      }),
    ],
    [t, nameKey],
  );
};
