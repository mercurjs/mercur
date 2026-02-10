import { HttpTypes } from "@medusajs/types"
import {
  ColumnDef,
  ColumnDefBase,
  createColumnHelper,
} from "@tanstack/react-table"
import { useMemo } from "react"
import {
  DateCell,
  DateHeader,
} from "../../../components/table/table-cells/common/date-cell"
import {
  DisplayIdCell,
  DisplayIdHeader,
} from "../../../components/table/table-cells/order/display-id-cell"
import {
  FulfillmentStatusCell,
  FulfillmentStatusHeader,
} from "../../../components/table/table-cells/order/fulfillment-status-cell"
import {
  PaymentStatusCell,
  PaymentStatusHeader,
} from "../../../components/table/table-cells/order/payment-status-cell"
import {
  TotalCell,
  TotalHeader,
} from "../../../components/table/table-cells/order/total-cell"
import { useTranslation } from "react-i18next"
import { getOrderStatus } from "../../../lib/order-helpers"
import { StatusCell } from "../../../components/table/table-cells/common/status-cell"
import { OrderPaymentStatus } from "../../../types/order"

// We have to use any here, as the type of Order is so complex that it lags the TS server
const columnHelper = createColumnHelper<HttpTypes.AdminOrder>()

type UseOrderTableColumnsProps = {
  exclude?: string[]
}

export const useOrderTableColumns = (props: UseOrderTableColumnsProps) => {
  const { exclude = [] } = props ?? {}

  const columns = useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <DisplayIdHeader />,
        cell: ({ getValue }) => {
          const id = getValue()

          return <DisplayIdCell displayId={id!} />
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => {
          const date = new Date(getValue())

          return <DateCell date={date} />
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Status</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const status = getValue()
          const { t } = useTranslation()

          const { label, color } = getOrderStatus(t, status)

          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("payment_status", {
        header: () => <PaymentStatusHeader />,
        cell: ({ getValue }) => {
          const status = getValue() as OrderPaymentStatus

          return status ? <PaymentStatusCell status={status} /> : "-"
        },
      }),
      columnHelper.accessor("fulfillment_status", {
        header: () => <FulfillmentStatusHeader />,
        cell: ({ getValue }) => {
          const status = getValue()

          return <FulfillmentStatusCell status={status} />
        },
      }),
      columnHelper.accessor("total", {
        header: () => <TotalHeader />,
        cell: ({ getValue, row }) => {
          const total = getValue()
          const currencyCode = row.original.currency_code

          return <TotalCell currencyCode={currencyCode} total={total} />
        },
      }),
    ],
    []
  )

  const isAccessorColumnDef = (
    c: any
  ): c is ColumnDef<HttpTypes.AdminOrder> & {
    accessorKey: string
  } => {
    return c.accessorKey !== undefined
  }

  const isDisplayColumnDef = (
    c: any
  ): c is ColumnDef<HttpTypes.AdminOrder> & {
    id: string
  } => {
    return c.id !== undefined
  }

  const shouldExclude = <TDef extends ColumnDefBase<HttpTypes.AdminOrder, any>>(
    c: TDef
  ) => {
    if (isAccessorColumnDef(c)) {
      return exclude.includes(c.accessorKey)
    } else if (isDisplayColumnDef(c)) {
      return exclude.includes(c.id)
    }

    return false
  }

  return columns.filter(
    (c) => !shouldExclude(c)
  ) as ColumnDef<HttpTypes.AdminOrder>[]
}
