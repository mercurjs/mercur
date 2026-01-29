import { Table, clx, Text, Skeleton } from "@medusajs/ui"
import { flexRender } from "@tanstack/react-table"
import * as React from "react"
import { DataTableEmptyStateProps } from "@medusajs/ui"

// Define the empty state enum to match @medusajs/ui
enum DataTableEmptyState {
  EMPTY = "EMPTY",
  FILTERED_EMPTY = "FILTERED_EMPTY",
  POPULATED = "POPULATED",
}

interface DataTableTableWithTestIdsProps<TData> {
  instance: {
    getHeaderGroups: () => any[]
    getRowModel: () => { rows: any[] }
    getAllColumns: () => any[]
    onRowClick?: (
      event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
      row: TData
    ) => void
    emptyState: DataTableEmptyState
    showSkeleton: boolean
    pageSize: number
    pageIndex: number
  }
  emptyState?: DataTableEmptyStateProps
}

/**
 * Custom table component that renders rows with data-testid attributes.
 * This is a simplified version of @medusajs/ui's DataTable.Table that adds test IDs.
 */
export const DataTableTableWithTestIds = <TData,>({
  instance,
  emptyState,
}: DataTableTableWithTestIdsProps<TData>) => {
  const hoveredRowId = React.useRef<string | null>(null)
  const [showStickyBorder, setShowStickyBorder] = React.useState(false)
  const scrollableRef = React.useRef<HTMLDivElement>(null)

  const columns = instance.getAllColumns()
  const hasSelect = columns.find((c) => c.id === "select")
  const hasActions = columns.find((c) => c.id === "action")

  const handleHorizontalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft
    if (scrollLeft > 0) {
      setShowStickyBorder(true)
    } else {
      setShowStickyBorder(false)
    }
  }

  React.useEffect(() => {
    scrollableRef.current?.scroll({ top: 0, left: 0 })
  }, [instance.pageIndex])

  if (instance.showSkeleton) {
    return <DataTableTableSkeleton pageSize={instance.pageSize} />
  }

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden">
      {instance.emptyState === DataTableEmptyState.POPULATED && (
        <div
          ref={scrollableRef}
          onScroll={handleHorizontalScroll}
          className="min-h-0 w-full flex-1 overflow-auto overscroll-none border-y"
        >
          <Table className="relative isolate w-full">
            <Table.Header
              className="shadow-ui-border-base sticky inset-x-0 top-0 z-[1] w-full border-b-0 border-t-0 shadow-[0_1px_1px_0]"
              style={{ transform: "translate3d(0,0,0)" }}
            >
              {instance.getHeaderGroups().map((headerGroup) => (
                <Table.Row
                  key={headerGroup.id}
                  data-testid={`data-table-header-row-${headerGroup.id}`}
                  className={clx("border-b-0", {
                    "[&_th:last-of-type]:w-[1%] [&_th:last-of-type]:whitespace-nowrap":
                      hasActions,
                    "[&_th:first-of-type]:w-[1%] [&_th:first-of-type]:whitespace-nowrap":
                      hasSelect,
                  })}
                >
                  {headerGroup.headers.map((header: any, idx: number) => {
                    const isActionHeader = header.id === "action"
                    const isSelectHeader = header.id === "select"
                    const isSpecialHeader = isActionHeader || isSelectHeader
                    const isFirstColumn = hasSelect ? idx === 1 : idx === 0

                    return (
                      <Table.HeaderCell
                        key={header.id}
                        data-testid={`data-table-header-${header.id}`}
                        className={clx("whitespace-nowrap", {
                          "w-[calc(20px+24px+24px)] min-w-[calc(20px+24px+24px)] max-w-[calc(20px+24px+24px)]":
                            isSelectHeader,
                          "w-[calc(28px+24px+4px)] min-w-[calc(28px+24px+4px)] max-w-[calc(28px+24px+4px)]":
                            isActionHeader,
                          "after:absolute after:inset-y-0 after:right-0 after:h-full after:w-px after:bg-transparent after:content-['']":
                            isFirstColumn,
                          "after:bg-ui-border-base":
                            showStickyBorder && isFirstColumn,
                          "bg-ui-bg-subtle sticky": isFirstColumn || isSelectHeader,
                          "left-0":
                            isSelectHeader || (isFirstColumn && !hasSelect),
                          "left-[calc(20px+24px+24px)]":
                            isFirstColumn && hasSelect,
                        })}
                        style={
                          !isSpecialHeader
                            ? {
                                width: header.column.columnDef.size,
                                maxWidth: header.column.columnDef.maxSize,
                                minWidth: header.column.columnDef.minSize,
                              }
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </Table.HeaderCell>
                    )
                  })}
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body className="border-b-0 border-t-0">
              {instance.getRowModel().rows.map((row, rowIndex) => {
                return (
                  <Table.Row
                    key={row.id}
                    data-testid={`data-table-row-${rowIndex}`}
                    onMouseEnter={() => (hoveredRowId.current = row.id)}
                    onMouseLeave={() => (hoveredRowId.current = null)}
                    onClick={(e) => instance.onRowClick?.(e, row)}
                    className={clx("group/row last-of-type:border-b-0", {
                      "cursor-pointer": !!instance.onRowClick,
                    })}
                  >
                    {row.getVisibleCells().map((cell: any, cellIndex: number) => {
                      const isSelectCell = cell.column.id === "select"
                      const isActionCell = cell.column.id === "action"
                      const isSpecialCell = isSelectCell || isActionCell
                      const isFirstColumn = hasSelect ? cellIndex === 1 : cellIndex === 0

                      return (
                        <Table.Cell
                          key={cell.id}
                          data-testid={`data-table-cell-${rowIndex}-${cellIndex}`}
                          className={clx(
                            "items-stretch truncate whitespace-nowrap",
                            {
                              "w-[calc(20px+24px+24px)] min-w-[calc(20px+24px+24px)] max-w-[calc(20px+24px+24px)]":
                                isSelectCell,
                              "w-[calc(28px+24px+4px)] min-w-[calc(28px+24px+4px)] max-w-[calc(28px+24px+4px)]":
                                isActionCell,
                              "bg-ui-bg-base group-hover/row:bg-ui-bg-base-hover transition-fg sticky h-full":
                                isFirstColumn || isSelectCell,
                              "after:absolute after:inset-y-0 after:right-0 after:h-full after:w-px after:bg-transparent after:content-['']":
                                isFirstColumn,
                              "after:bg-ui-border-base":
                                showStickyBorder && isFirstColumn,
                              "left-0":
                                isSelectCell || (isFirstColumn && !hasSelect),
                              "left-[calc(20px+24px+24px)]":
                                isFirstColumn && !!hasSelect,
                            }
                          )}
                          style={
                            !isSpecialCell
                              ? {
                                  width: cell.column.columnDef.size,
                                  maxWidth: cell.column.columnDef.maxSize,
                                  minWidth: cell.column.columnDef.minSize,
                                }
                              : undefined
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </Table.Cell>
                      )
                    })}
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </div>
      )}
      <DataTableEmptyStateDisplay
        state={instance.emptyState}
        props={emptyState}
      />
    </div>
  )
}

const DefaultEmptyStateContent = ({
  heading,
  description,
}: {
  heading?: string
  description?: string
}) => (
  <div className="flex size-full flex-col items-center justify-center gap-2">
    <Text size="base" weight="plus">
      {heading}
    </Text>
    <Text>{description}</Text>
  </div>
)

const DataTableEmptyStateDisplay = ({
  state,
  props,
}: {
  state: DataTableEmptyState
  props?: DataTableEmptyStateProps
}) => {
  if (state === DataTableEmptyState.POPULATED) {
    return null
  }

  const content =
    state === DataTableEmptyState.EMPTY ? props?.empty : props?.filtered

  return (
    <div className="flex min-h-[250px] w-full flex-1 flex-col items-center justify-center border-y px-6 py-4">
      {content?.custom ?? (
        <DefaultEmptyStateContent
          heading={content?.heading}
          description={content?.description}
        />
      )}
    </div>
  )
}

const DataTableTableSkeleton = ({ pageSize = 10 }: { pageSize?: number }) => {
  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden">
      <div className="min-h-0 w-full flex-1 overscroll-none border-y">
        <div className="flex flex-col divide-y">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: pageSize }, (_, i) => i).map((row) => (
            <Skeleton key={row} className="h-12 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}

