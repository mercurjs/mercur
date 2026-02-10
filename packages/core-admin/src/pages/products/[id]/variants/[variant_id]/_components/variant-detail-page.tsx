import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useProductVariant } from "@hooks/api/products"
import { useExtension } from "@providers/extension-provider"

import { VARIANT_DETAIL_FIELDS } from "../_common/constants"
import { variantLoader } from "../loader"

import {
  VariantDetailProvider,
  useVariantDetailContext,
} from "./variant-detail-context"
import { VariantGeneralSection } from "./variant-general-section"
import {
  InventorySectionPlaceholder,
  VariantInventorySection,
} from "./variant-inventory-section"
import { VariantPricesSection } from "./variant-prices-section"

// Sub-components that use context

function GeneralSection() {
  const { variant } = useVariantDetailContext()
  return <VariantGeneralSection variant={variant} />
}

function InventorySection() {
  const { variant } = useVariantDetailContext()

  if (!variant.manage_inventory) {
    return <InventorySectionPlaceholder />
  }

  return (
    <VariantInventorySection
      inventoryItems={
        variant.inventory_items?.map((i: any) => {
          return {
            ...i.inventory,
            required_quantity: i.required_quantity,
            variant,
          }
        }) ?? []
      }
    />
  )
}

function PricesSection() {
  const { variant } = useVariantDetailContext()
  return <VariantPricesSection variant={variant} />
}

// Main section wrapper
interface MainProps {
  children?: ReactNode
}

function Main({ children }: MainProps) {
  if (children && Children.count(children) > 0) {
    return <TwoColumnPage.Main>{children}</TwoColumnPage.Main>
  }

  return (
    <TwoColumnPage.Main>
      <GeneralSection />
      <InventorySection />
    </TwoColumnPage.Main>
  )
}

// Sidebar wrapper
interface SidebarProps {
  children?: ReactNode
}

function Sidebar({ children }: SidebarProps) {
  if (children && Children.count(children) > 0) {
    return <TwoColumnPage.Sidebar>{children}</TwoColumnPage.Sidebar>
  }

  return (
    <TwoColumnPage.Sidebar>
      <PricesSection />
    </TwoColumnPage.Sidebar>
  )
}

// Props
export interface VariantDetailPageProps {
  children?: ReactNode
}

// Root component
function VariantDetailPageRoot({ children }: VariantDetailPageProps) {
  const initialData = useLoaderData() as
    | Awaited<ReturnType<typeof variantLoader>>
    | undefined

  const { id, variant_id } = useParams()
  const { variant, isLoading, isError, error } = useProductVariant(
    id!,
    variant_id!,
    { fields: VARIANT_DETAIL_FIELDS },
    {
      initialData,
    }
  )

  const { getWidgets } = useExtension()

  if (isLoading || !variant) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  const contextValue = {
    variant,
    isLoading,
    isError,
    error: error as Error | null,
  }

  const hasCustomChildren = Children.count(children) > 0

  return (
    <VariantDetailProvider value={contextValue}>
      <TwoColumnPage
        data={variant}
        hasOutlet
        showJSON
        showMetadata
        widgets={{
          after: getWidgets("product_variant.details.after"),
          before: getWidgets("product_variant.details.before"),
          sideAfter: getWidgets("product_variant.details.side.after"),
          sideBefore: getWidgets("product_variant.details.side.before"),
        }}
      >
        {hasCustomChildren ? (
          children
        ) : (
          <>
            <Main />
            <Sidebar />
          </>
        )}
      </TwoColumnPage>
    </VariantDetailProvider>
  )
}

// Compound component export
export const VariantDetailPage = Object.assign(VariantDetailPageRoot, {
  Main,
  Sidebar,
  GeneralSection,
  InventorySection,
  PricesSection,
  useContext: useVariantDetailContext,
})
