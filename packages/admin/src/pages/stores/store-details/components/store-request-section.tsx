import { ExclamationCircleSolid } from "@medusajs/icons";
import { Button, Container, Heading, Text, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import {
  useApproveSeller,
  useTerminateSeller,
} from "../../../../hooks/api/sellers";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreRequestSectionProps = {
  seller: Seller;
};

export const StoreRequestSection = ({ seller }: StoreRequestSectionProps) => {
  const { t } = useTranslation();
  const { mutateAsync: approveSeller, isPending: isApproving } =
    useApproveSeller(seller.id);
  const { mutateAsync: terminateSeller, isPending: isTerminating } =
    useTerminateSeller(seller.id);

  const handleConfirm = async () => {
    try {
      await approveSeller();
      toast.success(
        t("stores.approve.successToast", "Store approved successfully"),
      );
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleReject = async () => {
    try {
      await terminateSeller();
      toast.success(
        t("stores.terminate.successToast", "Store rejected successfully"),
      );
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-col divide-y divide-dashed">
          <div className="flex items-center gap-2 px-6 py-4">
            <ExclamationCircleSolid className="text-orange-500" />
            <Heading level="h2">
              {t("stores.request.title", "Store request")}
            </Heading>
          </div>
          <div className="px-6 py-4">
            <Text className="text-ui-fg-subtle">
              {t(
                "stores.request.description",
                "A new store request has been submitted. Review the details, make any necessary updates, and choose whether to confirm and publish the store or terminate the request.",
              )}
            </Text>
          </div>
          <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
            <Button
              size="small"
              variant="secondary"
              onClick={handleConfirm}
              isLoading={isApproving}
            >
              {t("stores.request.confirm", "Confirm")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={handleReject}
              isLoading={isTerminating}
            >
              {t("stores.request.terminate", "Terminate")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};
