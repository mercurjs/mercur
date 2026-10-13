import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@medusajs/ui";
import { DateCell } from "@mercurjs/dashboard-shared";

import { StatusCell } from "@components/table/table-cells/common/status-cell";
import type { VendorReturnRequest } from "@hooks/api/return-requests";
import { customerName, getReturnRequestStatusProps } from "../../common/utils";

const columnHelper = createColumnHelper<VendorReturnRequest>();

export const useReturnRequestTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("order", {
        header: () => <span>{t("returnRequests.list.columns.order")}</span>,
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            #{getValue()?.display_id ?? "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("customer", {
        header: () => <span>{t("returnRequests.list.columns.customer")}</span>,
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            {customerName(getValue())}
          </Text>
        ),
      }),
      columnHelper.accessor("requested_by_type", {
        header: () => (
          <span>{t("returnRequests.list.columns.requestedBy")}</span>
        ),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {t(`returnRequests.actor.${getValue()}`)}
          </Text>
        ),
      }),
      columnHelper.accessor("note", {
        header: () => <span>{t("returnRequests.list.columns.note")}</span>,
        cell: ({ getValue }) => (
          <div className="w-[240px]">
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle line-clamp-2"
            >
              {getValue() || "-"}
            </Text>
          </div>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: () => <span>{t("returnRequests.list.columns.date")}</span>,
        cell: ({ getValue }) => <DateCell date={new Date(getValue())} />,
      }),
      columnHelper.accessor("status", {
        header: () => <span>{t("returnRequests.list.columns.status")}</span>,
        cell: ({ getValue }) => {
          const { color, label } = getReturnRequestStatusProps(getValue(), t);
          return <StatusCell color={color}>{label}</StatusCell>;
        },
      }),
    ],
    [t],
  );
};
