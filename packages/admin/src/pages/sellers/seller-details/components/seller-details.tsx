import type { AdminProductListResponse } from "@medusajs/types";

import type { AdminOrderListResponse } from "@custom-types/order";
import type { VendorSeller } from "@custom-types/seller";

import { useSellerOrdersTableQuery } from "@hooks/table/query";
import { SellerGeneralSection } from "../../common/components/seller-general-section";
import { SellerOrdersSection } from "../../common/components/seller-orders-section";
import { SellerProductsSection } from "../../common/components/seller-products-section";
import { useOrders, useProducts } from "@/hooks/api";

const PAGE_SIZE = 10;
const ORDER_PREFIX = "so";
const PRODUCT_PREFIX = "sp";

export const SellerDetails = () => {
  const { searchParams: orderSearchParams } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: ORDER_PREFIX,
  });

  const { searchParams: productSearchParams } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: PRODUCT_PREFIX,
  });

  const { orders, isLoading: ordersLoading } = useOrders({
    fields:
      "id,display_id,created_at,updated_at,*customer,currency_code,total,fulfillment_status,payment_status,status,region_id,sales_channel_id",
    ...orderSearchParams,
  });

  const {
    products,
    isLoading: productsLoading,
    refetch: productsRefetch,
  } = useProducts({
    fields:
      "*collection,+type_id,+tag_id,+sales_channel_id,+status,+created_at,+updated_at",
    ...productSearchParams,
  });

  if (ordersLoading || productsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SellerGeneralSection seller={data?.seller as VendorSeller} />
      <SellerOrdersSection seller_orders={orders as AdminOrderListResponse} />
      <SellerProductsSection
        seller_products={products as AdminProductListResponse}
        refetch={productsRefetch}
      />
    </>
  );
};
