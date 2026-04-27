import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { SellerStatusCell } from "../../../components/table/table-cells/seller/seller-status-cell/seller-status-cell";
import { DateCell } from "@/components/table/table-cells/common/date-cell";
import { SellerDTO, SellerStatus } from "@mercurjs/types";

const columnHelper = createColumnHelper<SellerDTO>();

export const useSellersTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.display({
        id: "name",
        header: t("stores.fields.name"),
        cell: ({ row }) => row.original.name,
      }),
      columnHelper.display({
        id: "email",
        header: t("stores.fields.email"),
        cell: ({ row }) => row.original.email,
      }),
      columnHelper.display({
        id: "status",
        header: t("fields.status"),
        cell: ({ row }) => {
          return (
            <SellerStatusCell
              status={row.original.status as SellerStatus}
            />
          );
        },
      }),
      columnHelper.display({
        id: "is_premium",
        header: t("stores.fields.premium"),
        cell: ({ row }) => (
          <span className="text-ui-fg-subtle">
            {row.original.is_premium
              ? t("stores.premium.yes")
              : t("stores.premium.no")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "created_at",
        header: t("fields.createdAt"),
        cell: ({ row }) => {
          return <DateCell date={row.original.created_at} />;
        },
      }),
    ],
    [t],
  );
};
