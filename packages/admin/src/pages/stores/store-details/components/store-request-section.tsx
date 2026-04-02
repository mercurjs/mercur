import { useState } from "react";
import { ExclamationCircleSolid } from "@medusajs/icons";
import {
  Button,
  Container,
  Heading,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import {
  useApproveSeller,
  useSuspendSeller,
} from "../../../../hooks/api/sellers";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreRequestSectionProps = {
  seller: Seller;
};

export const StoreRequestSection = ({ seller }: StoreRequestSectionProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const { mutateAsync: approveSeller, isPending: isApproving } =
    useApproveSeller(seller.id);
  const { mutateAsync: suspendSeller, isPending: isSuspending } =
    useSuspendSeller(seller.id);

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
      await suspendSeller({ reason: reason || undefined });
      toast.success(
        t("stores.suspend.successToast", "Store suspended successfully"),
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
                "A new store request has been submitted. Review the details, make any necessary updates, and choose whether to confirm and publish the store or suspend the request.",
              )}
            </Text>
          </div>
          <div className="flex flex-col gap-y-2 px-6 py-4">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              {t("stores.request.reasonLabel", "Suspend reason")}
            </Text>
            <Textarea
              placeholder={t(
                "stores.request.reasonPlaceholder",
                "Optional reason for suspending this store...",
              )}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
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
              isLoading={isSuspending}
            >
              {t("stores.request.suspend", "Suspend")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};
