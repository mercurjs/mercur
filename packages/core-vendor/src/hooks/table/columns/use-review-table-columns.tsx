import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { FirstSeenCell } from "../../../components/table/table-cells/customer/first-seen-cell"
import { CustomerHeader } from "../../../components/table/table-cells/review/customer-cell"
import {
  StarsCell,
  StarsHeader,
} from "../../../components/table/table-cells/review/stars-cell"
import {
  TextCell,
  TextHeader,
} from "../../../components/table/table-cells/common/text-cell"
import {
  StatusHeader,
  StatusCell,
} from "../../../components/table/table-cells/review/status-cell"
import { NameCell } from "../../../components/table/table-cells/common/name-cell"

const columnHelper = createColumnHelper<any>()

export const useReviewTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.display({
        id: "customer",
        header: () => <CustomerHeader />,
        cell: ({ row }) => (
          <NameCell
            firstName={row.original?.customer?.first_name || ""}
            lastName={row.original?.customer?.last_name || ""}
          />
        ),
      }),
      columnHelper.accessor("rating", {
        header: () => <StarsHeader />,
        cell: ({ getValue }) => <StarsCell rating={getValue()} />,
      }),
      columnHelper.accessor("customer_note", {
        header: () => <TextHeader text="Review" />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text="Added" />,
        cell: ({ getValue }) => <FirstSeenCell createdAt={getValue()} />,
      }),
      columnHelper.accessor("seller_note", {
        header: () => <StatusHeader />,
        cell: ({ getValue }) => <StatusCell status={getValue()} />,
      }),
    ],
    []
  )
}
