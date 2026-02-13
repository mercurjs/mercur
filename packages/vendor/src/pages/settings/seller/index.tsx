import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { SellerGeneralSection } from "./_components/seller-general-section";
import { useMe } from "@/hooks/api";

const SellerDetail = () => {
  const { seller, isPending, isError, error } = useMe();

  if (isPending || !seller) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage data={seller} hasOutlet>
      <SellerGeneralSection seller={seller} />
    </SingleColumnPage>
  );
};

export const Component = SellerDetail;
