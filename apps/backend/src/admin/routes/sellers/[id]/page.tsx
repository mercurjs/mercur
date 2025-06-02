import { useParams } from "react-router-dom";
import { useSeller, useSellerCustomerGroups, useSellerOrders, useSellerProducts } from "../../../hooks/api/seller";
import { SellerGeneralSection } from "./components/SellerGeneralSection";
import { SellerOrdersSection } from "./components/SellerOrdersSection";



const SellerDetailPage = () => {
  const { id } = useParams();

  const { data, isLoading } = useSeller(id!);

  const { data: orders, isLoading: ordersLoading } = useSellerOrders(id!);

  const { data: products, isLoading: productsLoading } = useSellerProducts(id!);

  const { data: customerGroups, isLoading: customerGroupsLoading } = useSellerCustomerGroups(id!);

  console.log(orders, products, customerGroups)

  if (isLoading) {  
    return <div>Loading...</div>;
  }

  return (
    <>
      <SellerGeneralSection seller={data.seller} />
      <SellerOrdersSection />
    </>
  );
};

export default SellerDetailPage;
