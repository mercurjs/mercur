import { HttpTypes } from "@medusajs/types"
import { AnimatePresence } from "motion/react"
import { ReactNode, Suspense, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Await, useLoaderData } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"

import { ProgressBar } from "@components/common/progress-bar"
import { Skeleton } from "@components/common/skeleton"
import { DataGridSkeleton } from "@components/data-grid/components"
import { RouteFocusModal } from "@components/modals"

import { ProductStockForm } from "./product-stock-form"
import {
  ProductStockProvider,
  useProductStockContext,
} from "./product-stock-context"

function StockProgressBar() {
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsLoading(true)
    }, 200)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1"
      data-testid="product-stock-progress-bar-container"
    >
      <AnimatePresence>
        {isLoading ? <ProgressBar duration={5} /> : null}
      </AnimatePresence>
    </div>
  )
}

function Fallback() {
  return (
    <div className="relative flex size-full flex-col items-center justify-center divide-y">
      <div className="flex size-full flex-col divide-y">
        <div className="px-4 py-2">
          <Skeleton className="h-7 w-7" />
        </div>
        <div className="flex-1 overflow-auto">
          <DataGridSkeleton
            columns={Array.from({ length: 10 }) as ColumnDef<any>[]}
          />
        </div>
        <div className="bg-ui-bg-base flex items-center justify-end gap-x-2 p-4">
          <Skeleton className="h-7 w-[59px]" />
          <Skeleton className="h-7 w-[46px]" />
        </div>
      </div>
    </div>
  )
}

function Content() {
  const { data } = useProductStockContext()
  const [, setIsLoading] = useState(true)

  const onLoaded = () => {
    setIsLoading(false)
  }

  return (
    <Suspense fallback={<Fallback />}>
      <Await resolve={data}>
        {(
          resolvedData: {
            variants: HttpTypes.AdminProductVariant[]
            locations: HttpTypes.AdminStockLocation[]
          }
        ) => {
          return (
            <ProductStockForm
              variants={resolvedData.variants}
              locations={resolvedData.locations}
              onLoaded={onLoaded}
            />
          )
        }}
      </Await>
    </Suspense>
  )
}

function Title() {
  const { t } = useTranslation()

  return (
    <>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.stock.heading")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.stock.description")}</span>
      </RouteFocusModal.Description>
    </>
  )
}

export interface ProductStockModalProps {
  children?: ReactNode
}

function Root({ children }: ProductStockModalProps) {
  const loaderData = useLoaderData() as {
    data: Promise<{
      variants: HttpTypes.AdminProductVariant[]
      locations: HttpTypes.AdminStockLocation[]
    }>
  }

  return (
    <ProductStockProvider value={{ data: loaderData.data }}>
      <div>
        <StockProgressBar />
        <RouteFocusModal data-testid="product-stock-modal">
          {children ?? (
            <>
              <Title />
              <Content />
            </>
          )}
        </RouteFocusModal>
      </div>
    </ProductStockProvider>
  )
}

export const ProductStockModal = Object.assign(Root, {
  ProgressBar: StockProgressBar,
  Fallback,
  Title,
  Content,
  useContext: useProductStockContext,
})
