import { clx, Container, Heading } from "@medusajs/ui"
import React, { useLayoutEffect, useRef, useState } from "react"

import { _DataTable } from "../table/data-table/data-table"
import { TableSkeleton } from "../common/skeleton"

type InnerDataTableProps<TData> = Parameters<typeof _DataTable<TData>>[0]

type DataTableWithStickyFooterProps<TData> = InnerDataTableProps<TData> & {
  heading: string | React.ReactNode
  className?: string
  marginPx?: number
}

export function DataTableWithStickyFooter<TData>({
  heading,
  className,
  marginPx = 16,
  isLoading,
  ...dataTableProps
}: DataTableWithStickyFooterProps<TData>) {
  const [containerMaxHeight, setContainerMaxHeight] = useState<number | null>(
    null
  )

  const containerRef = useRef<HTMLDivElement | null>(null)

  function handleCalcMaxHeight() {
    const container = containerRef.current
    if (!container) {
      return
    }

    const rect = container?.getBoundingClientRect()
    const availableVerticalSpace = Math.max(
      0,
      window.innerHeight - rect.top - marginPx
    )
    setContainerMaxHeight(availableVerticalSpace)
  }

  useLayoutEffect(() => {
    handleCalcMaxHeight()

    window.addEventListener("resize", handleCalcMaxHeight)
    window.addEventListener("scroll", handleCalcMaxHeight)

    return () => {
      window.removeEventListener("resize", handleCalcMaxHeight)
      window.removeEventListener("scroll", handleCalcMaxHeight)
    }
  }, [])

  return (
    <Container
      ref={containerRef}
      className={clx("divide-y p-0 flex flex-col", className)}
      style={{
        maxHeight: containerMaxHeight ? `${containerMaxHeight}px` : undefined,
      }}
    >
      {isLoading ? (
        <TableSkeleton layout="fit" />
      ) : (
        <>
          <div className="flex items-center justify-between px-6 py-4">
            <Heading>{heading}</Heading>
          </div>
          <_DataTable
            {...(dataTableProps as InnerDataTableProps<TData>)}
            layout="fill"
            isLoading={false}
          />
        </>
      )}
    </Container>
  )
}
