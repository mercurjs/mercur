import { useParams } from "react-router-dom";
import { useSeller, useSellerCustomerGroups, useSellerOrders, useSellerProducts } from "../../../hooks/api/seller";
import { SellerGeneralSection } from "./components/SellerGeneralSection";
import { SellerOrdersSection } from "./components/SellerOrdersSection";
import { useSellerOrdersTableQuery } from "../helpers";

const PAGE_SIZE = 10

const SellerDetailPage = () => {
  const { id } = useParams();

  const { searchParams } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
  })

  const { data, isLoading } = useSeller(id!);

  const { data: orders, isLoading: ordersLoading } = useSellerOrders(id!, {fields:
    'id,display_id,created_at,*customer,currency_code,total,fulfillment_status,payment_status,status'}, searchParams);

  const { data: products, isLoading: productsLoading } = useSellerProducts(id!);

//   const { data: customerGroups, isLoading: customerGroupsLoading } = useSellerCustomerGroups(id!);


  if (
    isLoading 
    || ordersLoading 
    || productsLoading 
    // || customerGroupsLoading
  ) {  
    return <div>Loading...</div>;
  }

  return (
    <>
      <SellerGeneralSection seller={data.seller} />
      <SellerOrdersSection orders={orders.orders} />
    </>
  );
};

export default SellerDetailPage;
