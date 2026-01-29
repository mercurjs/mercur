import { HttpTypes } from "@medusajs/types"
import { ReactNode, Children } from "react"
import { useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useProduct } from "@hooks/api/products"
import { productsQueryKeys } from "@hooks/api/products"
import { useExtension } from "@providers/extension-provider"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { getLinkedFields } from "@/dashboard-app"

import {
  ProductDetailProvider,
  useProductDetailContext,
} from "./product-detail-context"

// Sections
import { ProductGeneralSection } from "./sections/product-general-section"
import { ProductMediaSection } from "./sections/product-media-section"
import { ProductOptionSection } from "./sections/product-option-section"
import { ProductVariantSection } from "./sections/product-variant-section"
import { ProductSalesChannelSection } from "./sections/product-sales-channel-section"
import { ProductShippingProfileSection } from "./sections/product-shipping-profile-section"
import { ProductOrganizationSection } from "./sections/product-organization-section"
import { ProductAttributeSection } from "./sections/product-attribute-section"
import { ProductAdditionalAttributeSection } from "./sections/product-additional-attribute-section"

// Constants
export const PRODUCT_DETAIL_FIELDS = getLinkedFields(
  "product",
  "*categories,*shipping_profile,-variants"
)

// Loader
const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, { fields: PRODUCT_DETAIL_FIELDS }),
  queryFn: async () =>
    sdk.admin.product.retrieve(id, { fields: PRODUCT_DETAIL_FIELDS }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = productDetailQuery(id!)

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  })

  return response
}

// Breadcrumb
export const Breadcrumb = (props: { params?: { id?: string }; data?: HttpTypes.AdminProductResponse }) => {
  const { id } = props.params || {}

  const { product } = useProduct(
    id!,
    { fields: PRODUCT_DETAIL_FIELDS },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!product) {
    return null
  }

  return <span>{product.title}</span>
}

// Sub-components that use context
function GeneralSection() {
  const { product } = useProductDetailContext()
  return <ProductGeneralSection product={product} />
}

function MediaSection() {
  const { product } = useProductDetailContext()
  return <ProductMediaSection product={product} />
}

function OptionSection() {
  const { product } = useProductDetailContext()
  return <ProductOptionSection product={product} />
}

function VariantSection() {
  const { product } = useProductDetailContext()
  return <ProductVariantSection product={product} />
}

function SalesChannelSection() {
  const { product } = useProductDetailContext()
  return <ProductSalesChannelSection product={product} />
}

function ShippingProfileSection() {
  const { product } = useProductDetailContext()
  return <ProductShippingProfileSection product={product} />
}

function OrganizationSection() {
  const { product } = useProductDetailContext()
  return <ProductOrganizationSection product={product} />
}

function AttributeSection() {
  const { product } = useProductDetailContext()
  return <ProductAttributeSection product={product} />
}

function AdditionalAttributeSection() {
  return <ProductAdditionalAttributeSection />
}

// Main section wrapper
interface MainProps {
  children?: ReactNode
}

function Main({ children }: MainProps) {
  const { product } = useProductDetailContext()

  // If children provided, render them
  if (children && Children.count(children) > 0) {
    return <TwoColumnPage.Main data-testid="product-detail-main">{children}</TwoColumnPage.Main>
  }

  // Default sections
  return (
    <TwoColumnPage.Main data-testid="product-detail-main">
      <ProductGeneralSection product={product} />
      <ProductMediaSection product={product} />
      <ProductOptionSection product={product} />
      <ProductVariantSection product={product} />
    </TwoColumnPage.Main>
  )
}

// Sidebar wrapper
interface SidebarProps {
  children?: ReactNode
}

function Sidebar({ children }: SidebarProps) {
  const { product } = useProductDetailContext()

  // If children provided, render them
  if (children && Children.count(children) > 0) {
    return <TwoColumnPage.Sidebar data-testid="product-detail-sidebar">{children}</TwoColumnPage.Sidebar>
  }

  // Default sections
  return (
    <TwoColumnPage.Sidebar data-testid="product-detail-sidebar">
      <ProductSalesChannelSection product={product} />
      <ProductShippingProfileSection product={product} />
      <ProductOrganizationSection product={product} />
      <ProductAttributeSection product={product} />
      <ProductAdditionalAttributeSection />
    </TwoColumnPage.Sidebar>
  )
}

// Props
export interface ProductDetailPageProps {
  children?: ReactNode
}

// Root component
function ProductDetailPageRoot({ children }: ProductDetailPageProps) {
  const initialData = useLoaderData() as HttpTypes.AdminProductResponse | undefined

  const { id } = useParams()
  const { product, isLoading, isError, error } = useProduct(
    id!,
    { fields: PRODUCT_DETAIL_FIELDS },
    { initialData }
  )

  const { getWidgets } = useExtension()

  const after = getWidgets("product.details.after")
  const before = getWidgets("product.details.before")
  const sideAfter = getWidgets("product.details.side.after")
  const sideBefore = getWidgets("product.details.side.before")

  if (isLoading || !product) {
    return (
      <TwoColumnPageSkeleton
        mainSections={4}
        sidebarSections={3}
        showJSON
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  const contextValue = {
    product,
    isLoading,
    isError,
    error: error as Error | null,
  }

  const hasCustomChildren = Children.count(children) > 0

  return (
    <ProductDetailProvider value={contextValue}>
      <div data-testid="product-detail-page">
        <TwoColumnPage
          widgets={{
            after,
            before,
            sideAfter,
            sideBefore,
          }}
          showJSON
          showMetadata
          data={product}
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
      </div>
    </ProductDetailProvider>
  )
}

// Compound component export
export const ProductDetailPage = Object.assign(ProductDetailPageRoot, {
  Main,
  Sidebar,
  GeneralSection,
  MediaSection,
  OptionSection,
  VariantSection,
  SalesChannelSection,
  ShippingProfileSection,
  OrganizationSection,
  AttributeSection,
  AdditionalAttributeSection,
  useContext: useProductDetailContext,
})
