import { RouteDrawer } from "../../../../components/route-drawer/RouteDrawer";
import { useNavigate, useParams } from "react-router-dom";
import SellerDetailPage from "../seller-details-page";
import { useSeller } from "../../../../hooks/api/seller";
import { SellerEditForm } from "./seller-edit-form";

const SellerEditPage = () => {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isLoading } = useSeller(params.id!);

  if (isLoading) {
    return <div>Loading...</div>;
  }
    
  return (
    <>
      <SellerDetailPage />
      <RouteDrawer 
        header="Edit seller" 
        onClose={(open: boolean) => !open && navigate(-1)}
      >
        <SellerEditForm seller={data.seller} />
      </RouteDrawer>
    </>
  );
};

export default SellerEditPage;