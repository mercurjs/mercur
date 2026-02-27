import { useStore } from "@/hooks/api";
import { RouteFocusModal } from "../../../components/modals";
import { CreateCommissionRateForm } from "./components/create-commission-rate-form";

export const CommissionRateCreate = () => {
  const { isLoading, store } = useStore();

  return (
    <RouteFocusModal>
      {!isLoading && store && <CreateCommissionRateForm store={store} />}
    </RouteFocusModal>
  );
};
