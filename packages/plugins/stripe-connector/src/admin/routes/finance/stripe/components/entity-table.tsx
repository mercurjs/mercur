import { Container, Heading, Text } from "@medusajs/ui"
import { _DataTable, useDataTable, useQueryParams } from "@mercurjs/dashboard-shared"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, type ReactNode } from "react"

export const PAGE_SIZE = 20

export function useListParams() {
  const raw = useQueryParams(["offset"])
  return { raw, offset: raw.offset ? Number(raw.offset) : 0, limit: PAGE_SIZE }
}

type Props<T extends { id: string }> = {
  title: string
  subtitle: string
  rows: T[]
  count: number
  columns: ColumnDef<T, unknown>[]
  isLoading: boolean
  queryObject: Record<string, string | undefined>
  actions?: ReactNode
  emptyTitle: string
  emptyMessage: string
  testId: string
  navigateTo?: (id: string) => string
}

export function EntityTable<T extends { id: string }>(props: Props<T>) {
  const data = useMemo(() => props.rows, [props.rows])
  const { table } = useDataTable({
    data,
    columns: props.columns,
    count: props.count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  return (
    <Container className="divide-y p-0" data-testid={props.testId}>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{props.title}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {props.subtitle}
          </Text>
        </div>
        {props.actions}
      </div>
      <_DataTable
        table={table}
        columns={props.columns}
        count={props.count}
        pageSize={PAGE_SIZE}
        isLoading={props.isLoading}
        queryObject={props.queryObject}
        pagination
        navigateTo={props.navigateTo ? (row) => props.navigateTo!(row.original.id) : undefined}
        noRecords={{ title: props.emptyTitle, message: props.emptyMessage }}
      />
    </Container>
  )
}
