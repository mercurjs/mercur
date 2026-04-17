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
    <Container className="p-0">
      <div className="flex items-center gap-x-3 border-b border-ui-border-base px-6 py-4">
        <ExclamationCircleSolid className="text-orange-500" />
        <Heading level="h2">
          {t("stores.request.title")}
        </Heading>
      </div>
      <div className="px-6 py-4">
        <Text className="text-ui-fg-subtle">
          {t("stores.request.description")}
        </Text>
      </div>
      <div className="flex flex-col gap-y-2 border-t border-ui-border-base px-6 py-4">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          {t("stores.request.reasonLabel")}
        </Text>
        <Textarea
          placeholder={t("stores.request.reasonPlaceholder")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end gap-x-2 rounded-b-lg border-t border-ui-border-base bg-ui-bg-subtle px-6 py-4">
        <Button
          size="small"
          variant="secondary"
          onClick={handleConfirm}
          isLoading={isApproving}
        >
          {t("stores.request.confirm")}
        </Button>
        <Button
          size="small"
          variant="secondary"
          onClick={handleReject}
          isLoading={isSuspending}
        >
          {t("stores.request.suspend")}
        </Button>
      </div>
    </Container>
  );
};
