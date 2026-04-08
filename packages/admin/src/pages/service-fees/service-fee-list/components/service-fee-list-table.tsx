import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Badge, clx } from "@medusajs/ui"
import { createDataTableColumnHelper } from "@medusajs/ui"
import { _DataTable } from "../../../../components/table/data-table"
import { useDataTable } from "../../../../hooks/use-data-table"
import { useServiceFees } from "../../../../hooks/api/service-fees"
import { useQueryParams } from "../../../../hooks/use-query-params"

const columnHelper = createDataTableColumnHelper<any>()

const statusColorMap: Record<string, string> = {
  active: "green",
  pending: "blue",
  inactive: "grey",
}

const useColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Fee ID",
        cell: ({ getValue }) => {
          const id = getValue()
          return <span className="txt-compact-small">#{id?.split("_").pop()}</span>
        },
      }),
      columnHelper.accessor("name", {
        header: "Fee Name",
      }),
      columnHelper.accessor("display_name", {
        header: "Display Name",
      }),
      columnHelper.accessor("charging_level", {
        header: "Charging Level",
        cell: ({ getValue }) => {
          const level = getValue()
          return (
            <span className="capitalize">{level}</span>
          )
        },
      }),
      columnHelper.accessor("value", {
        header: "Rate (%)",
        cell: ({ getValue }) => `${getValue()}%`,
      }),
      columnHelper.accessor("start_date", {
        header: "Period",
        cell: ({ row }) => {
          const start = row.original.start_date
          const end = row.original.end_date
          if (!start) return "-"
          const fmt = (d: string) =>
            new Date(d).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          return `${fmt(start)}${end ? ` to ${fmt(end)}` : ""}`
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue() as string
          return (
            <Badge
              color={statusColorMap[status] as any ?? "grey"}
              size="xsmall"
            >
              {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Created Date",
        cell: ({ getValue }) => {
          const date = getValue()
          return date
            ? new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : "-"
        },
      }),
    ],
    []
  )
}

export const ServiceFeeListTable = () => {
  const navigate = useNavigate()
  const params = useQueryParams(["q", "status", "charging_level", "offset", "limit"])

  const {
    service_fees,
    count,
    isLoading,
  } = useServiceFees({
    limit: 20,
    offset: 0,
    ...params,
  })

  const columns = useColumns()

  const table = useDataTable({
    data: service_fees ?? [],
    columns,
    count: count ?? 0,
    pageSize: 20,
    isLoading,
    onRowClick: (row) => {
      navigate(`/service-fees/${row.original.id}`)
    },
  })

  return (
    <Container className="p-0 overflow-hidden">
      <_DataTable instance={table} />
    </Container>
  )
}
