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
        cell: ({ row }) => <SellerStatusCell status={row.original.status} />,
      }),
      columnHelper.display({
        id: "created_at",
        header: "Created",
        cell: ({ getValue }) => {
          return <DateCell date={getValue()} />;
        },
      }),
    ],
    [],
  );
};
