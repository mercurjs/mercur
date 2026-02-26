import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import { SellerStatusCell } from "../../../components/table/table-cells/seller/seller-status-cell/seller-status-cell";
import { DateCell } from "@/components/table/table-cells/common/date-cell";
import { SellerDTO } from "@mercurjs/types";

const columnHelper = createColumnHelper<SellerDTO>();

export const useSellersTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.display({
        id: "email",
        header: "Email",
        cell: ({ row }) => row.original.email,
      }),
      columnHelper.display({
        id: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          return <SellerStatusCell status={row.original.status} />;
        },
      }),
      columnHelper.display({
        id: "created_at",
        header: "Created",
        cell: ({ row }) => {
          return <DateCell date={row.original.created_at} />;
        },
      }),
    ],
    [],
  );
};
