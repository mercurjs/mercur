import { useParams } from "react-router-dom";
import { RouteFocusModal } from "../../../components/modals";
import { useSeller } from "../../../hooks/api/sellers";
import { AddRegionsForm } from "./components/add-regions-form";

export const StoreAddRegions = () => {
  const { id } = useParams();

  const {
    seller,
    isPending: isLoading,
    isError,
    error,
  } = useSeller(id!, { fields: "+regions.id" });

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal data-testid="store-add-regions-modal">
      {!isLoading && seller && <AddRegionsForm seller={seller} />}
    </RouteFocusModal>
  );
};
