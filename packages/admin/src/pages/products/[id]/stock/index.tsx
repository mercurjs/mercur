// Route: /products/:id/stock
// Product stock management modal with deferred loading

import { HttpTypes } from "@medusajs/types"
import { AnimatePresence } from "motion/react"
import { Suspense, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Await, useLoaderData, defer, LoaderFunctionArgs } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"

import { ProgressBar } from "@components/common/progress-bar"
import { Skeleton } from "@components/common/skeleton"
import { DataGridSkeleton } from "@components/data-grid/components"
import { RouteFocusModal } from "@components/modals"
import { sdk } from "@lib/client"
import { PRODUCT_VARIANT_IDS_KEY } from "@pages/products/common/constants"

// Import form component
import { ProductStockForm } from "./_components/product-stock-form"

// Loader
async function getProductStockData(id: string, productVariantIds?: string[]) {
  const CHUNK_SIZE = 20
  let offset = 0
  let totalCount = 0

  let allVariants: HttpTypes.AdminProductVariant[] = []

  do {
    const { variants: chunk, count } = await sdk.admin.product.listVariants(
      id,
      {
        id: productVariantIds,
        offset,
        limit: CHUNK_SIZE,
        fields:
          "id,title,sku,inventory_items,inventory_items.*,inventory_items.inventory,inventory_items.inventory.id,inventory_items.inventory.title,inventory_items.inventory.sku,*inventory_items.inventory.location_levels,product.thumbnail",
      }
    )

    allVariants = [...allVariants, ...chunk]
    totalCount = count
    offset += CHUNK_SIZE
  } while (allVariants.length < totalCount)

  const { stock_locations } = await sdk.admin.stockLocation.list({
    limit: 9999,
    fields: "id,name",
  })

  return {
    variants: allVariants,
    locations: stock_locations,
  }
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const id = params.id!
  const searchParams = new URLSearchParams(request.url)
  const productVariantIds =
    searchParams.get(PRODUCT_VARIANT_IDS_KEY)?.split(",") || undefined

  const dataPromise = getProductStockData(id, productVariantIds)

  return defer({
    data: dataPromise,
  })
}

// Fallback skeleton
const ProductStockFallback = () => {
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

export const Component = () => {
  const { t } = useTranslation()
  const data = useLoaderData() as { data: Promise<{
    variants: HttpTypes.AdminProductVariant[]
    locations: HttpTypes.AdminStockLocation[]
  }> }

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

  const onLoaded = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsLoading(false)
  }

  return (
    <div>
      <div className="fixed inset-x-0 top-0 z-50 h-1" data-testid="product-stock-progress-bar-container">
        <AnimatePresence>
          {isLoading ? <ProgressBar duration={5} /> : null}
        </AnimatePresence>
      </div>
      <RouteFocusModal data-testid="product-stock-modal">
        <RouteFocusModal.Title asChild>
          <span className="sr-only">{t("products.stock.heading")}</span>
        </RouteFocusModal.Title>
        <RouteFocusModal.Description asChild>
          <span className="sr-only">{t("products.stock.description")}</span>
        </RouteFocusModal.Description>
        <Suspense fallback={<ProductStockFallback />}>
          <Await resolve={data.data}>
            {(resolvedData: {
              variants: HttpTypes.AdminProductVariant[]
              locations: HttpTypes.AdminStockLocation[]
            }) => {
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
      </RouteFocusModal>
    </div>
  )
}
