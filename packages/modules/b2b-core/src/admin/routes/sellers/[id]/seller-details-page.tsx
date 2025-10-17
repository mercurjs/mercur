import { useParams } from "react-router-dom";
import { useSeller, useSellerCustomerGroups, useSellerOrders, useSellerProducts } from "../../../hooks/api/seller";
import { SellerGeneralSection } from "./components/SellerGeneralSection";
import { SellerOrdersSection } from "./components/SellerOrdersSection";
import { useSellerOrdersTableQuery } from "../helpers";
import { SellerProductsSection } from "./components/SellerProductsSection";
import { SellerCustomerGroupsSection } from "./components/SellerCustomerGroupsSection";

const PAGE_SIZE = 10
const ORDER_PREFIX = 'so'
const PRODUCT_PREFIX = 'sp'
const CUSTOMER_GROUP_PREFIX = 'scg'

const SellerDetailPage = () => {
  const { id } = useParams();

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


  const { data, isLoading } = useSeller(id!);

  const { data: orders, isLoading: ordersLoading } = useSellerOrders(id!, {fields:
    'id,display_id,created_at,updated_at,*customer,currency_code,total,fulfillment_status,payment_status,status,region_id,sales_channel_id'}, orderSearchParams);

  const { data: products, isLoading: productsLoading, refetch: productsRefetch } = useSellerProducts(id!, {
    fields: "*collection,+type_id,+tag_id,+sales_channel_id,+status,+created_at,+updated_at"
  }, productSearchParams);

  const { data: customerGroups, isLoading: customerGroupsLoading, refetch: customerGroupsRefetch } = useSellerCustomerGroups(id!, {
    fields: "id,name,description,created_at,updated_at,*customers"
  }, customerGroupSearchParams);


  if (
    isLoading 
    || ordersLoading 
    || productsLoading 
    || customerGroupsLoading
  ) {  
    return <div>Loading...</div>;
  }

  return (
    <>
      <SellerGeneralSection seller={data.seller} />
      <SellerOrdersSection seller_orders={orders} />
      <SellerProductsSection seller_products={products} refetch={productsRefetch} />
      <SellerCustomerGroupsSection seller_customer_groups={customerGroups} refetch={customerGroupsRefetch} />
    </>
  );
};

export default SellerDetailPage;
