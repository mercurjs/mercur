import { ReactNode, Children } from "react"
import { useParams } from "react-router-dom"

import type { AdminProductListResponse } from "@medusajs/types"
import type { AdminCustomerGroupListResponse } from "@custom-types/customer-group"
import type { AdminOrderListResponse } from "@custom-types/order"
import type { VendorSeller } from "@custom-types/seller"

import {
  useSeller,
  useSellerCustomerGroups,
  useSellerOrders,
  useSellerProducts,
} from "@hooks/api/sellers"
import { useSellerOrdersTableQuery } from "@hooks/table/query"

import { SellerGeneralSection } from "@pages/sellers/common/components/seller-general-section"
import { SellerOrdersSection } from "@pages/sellers/common/components/seller-orders-section"
import { SellerProductsSection } from "@pages/sellers/common/components/seller-products-section"
import { SellerCustomerGroupsSection } from "@pages/sellers/common/components/seller-customer-groups-section"

import {
  SellerDetailProvider,
  useSellerDetailContext,
} from "./seller-detail-context"

const PAGE_SIZE = 10
const ORDER_PREFIX = "so"
const PRODUCT_PREFIX = "sp"
const CUSTOMER_GROUP_PREFIX = "scg"

// Sub-components that use context
function GeneralSection() {
  const { seller } = useSellerDetailContext()
  return <SellerGeneralSection seller={seller} />
}

function OrdersSection() {
  const { orders } = useSellerDetailContext()
  return <SellerOrdersSection seller_orders={orders as AdminOrderListResponse} />
}

function ProductsSection() {
  const { products, refetchProducts } = useSellerDetailContext()
  return (
    <SellerProductsSection
      seller_products={products as AdminProductListResponse}
      refetch={refetchProducts}
    />
  )
}

function CustomerGroupsSection() {
  const { customerGroups, refetchCustomerGroups } = useSellerDetailContext()
  return (
    <SellerCustomerGroupsSection
      seller_customer_groups={customerGroups as AdminCustomerGroupListResponse}
      refetch={refetchCustomerGroups}
    />
  )
}

// Props
export interface SellerDetailPageProps {
  children?: ReactNode
}

// Root component
function SellerDetailPageRoot({ children }: SellerDetailPageProps) {
  const { id } = useParams()

  const { searchParams: orderSearchParams } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: ORDER_PREFIX,
  })

  const { searchParams: productSearchParams } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: PRODUCT_PREFIX,
  })

  const { searchParams: customerGroupSearchParams } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: CUSTOMER_GROUP_PREFIX,
  })

  const { data, isLoading, isError, error } = useSeller(id!)

  const { data: orders, isLoading: ordersLoading } = useSellerOrders(
    id!,
    {
      fields:
        "id,display_id,created_at,updated_at,*customer,currency_code,total,fulfillment_status,payment_status,status,region_id,sales_channel_id",
    },
    orderSearchParams
  )

  const {
    data: products,
    isLoading: productsLoading,
    refetch: productsRefetch,
  } = useSellerProducts(
    id!,
    {
      fields:
        "*collection,+type_id,+tag_id,+sales_channel_id,+status,+created_at,+updated_at",
    },
    productSearchParams
  )

  const {
    data: customerGroups,
    isLoading: customerGroupsLoading,
    refetch: customerGroupsRefetch,
  } = useSellerCustomerGroups(
    id!,
    {
      fields: "id,name,description,created_at,updated_at,*customers",
    },
    customerGroupSearchParams
  )

  const loading = isLoading || ordersLoading || productsLoading || customerGroupsLoading

  if (loading) {
    return <div>Loading...</div>
  }

  if (isError) {
    throw error
  }

  if (!data?.seller) {
    return <div>Seller not found</div>
  }

  const contextValue: import("./seller-detail-context").SellerDetailContextValue = {
    seller: data.seller as VendorSeller,
    orders: orders as AdminOrderListResponse,
    products: products as AdminProductListResponse,
    customerGroups: customerGroups as AdminCustomerGroupListResponse,
    isLoading: loading,
    isError,
    error: error as Error | null,
    refetchProducts: productsRefetch,
    refetchCustomerGroups: customerGroupsRefetch,
  }

  const hasCustomChildren = Children.count(children) > 0

  return (
    <SellerDetailProvider value={contextValue}>
      <div data-testid="seller-detail-page">
        {hasCustomChildren ? (
          children
        ) : (
          // Default layout
          <>
            <SellerDetailPage.GeneralSection />
            <SellerDetailPage.OrdersSection />
            <SellerDetailPage.ProductsSection />
            <SellerDetailPage.CustomerGroupsSection />
          </>
        )}
      </div>
    </SellerDetailProvider>
  )
}

// Compound component export
export const SellerDetailPage = Object.assign(SellerDetailPageRoot, {
  GeneralSection,
  OrdersSection,
  ProductsSection,
  CustomerGroupsSection,
  useContext: useSellerDetailContext,
})
