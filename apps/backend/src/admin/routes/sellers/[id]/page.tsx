import { useParams } from "react-router-dom";
import { useSeller, useSellerOrders } from "../../../hooks/api/seller";
import { SellerGeneralSection } from "./components/SellerGeneralSection";
import { SellerOrdersSection } from "./components/SellerOrdersSection";



const SellerDetailPage = () => {
  const { id } = useParams();

  const { data, isLoading } = useSeller(id!);

  const { data: orders, isLoading: ordersLoading } = useSellerOrders(id!);

  console.log(orders, ordersLoading)

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
