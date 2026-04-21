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

type PendingAction = "confirm" | "reject" | null;

export const StoreRequestSection = ({ seller }: StoreRequestSectionProps) => {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [note, setNote] = useState("");

  const { mutateAsync: approveSeller, isPending: isApproving } =
    useApproveSeller(seller.id);
  const { mutateAsync: suspendSeller, isPending: isRejecting } =
    useSuspendSeller(seller.id);

  const requesterLabel = seller.email || seller.name;

  const cancel = () => {
    setPendingAction(null);
    setNote("");
  };

  const submit = async () => {
    try {
      if (pendingAction === "confirm") {
        await approveSeller();
        toast.success(t("stores.request.confirmSuccess"));
      } else if (pendingAction === "reject") {
        await suspendSeller({ reason: note || undefined });
        toast.success(t("stores.request.rejectSuccess"));
      }
      cancel();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const isSubmitting = isApproving || isRejecting;

  return (
    <Container className="p-0">
      <div className="flex items-center gap-x-3 border-b border-ui-border-base px-6 py-4">
        <ExclamationCircleSolid className="text-ui-tag-blue-icon" />
        <Heading level="h2">{t("stores.request.title")}</Heading>
      </div>
      <div className="px-6 py-4">
        <Text className="text-ui-fg-subtle">
          {t("stores.request.description", { requester: requesterLabel })}
        </Text>
      </div>
      {pendingAction ? (
        <div className="flex flex-col gap-y-2 border-t border-ui-border-base px-6 py-4">
          <Text size="small" weight="plus" className="text-ui-fg-subtle">
            {pendingAction === "confirm"
              ? t("stores.request.confirmNoteLabel")
              : t("stores.request.rejectNoteLabel")}
          </Text>
          <Textarea
            placeholder={t("stores.request.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-x-2 rounded-b-lg border-t border-ui-border-base bg-ui-bg-subtle px-6 py-4">
        {pendingAction ? (
          <>
            <Button
              size="small"
              variant="secondary"
              onClick={cancel}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              size="small"
              variant={pendingAction === "reject" ? "danger" : "primary"}
              onClick={submit}
              isLoading={isSubmitting}
            >
              {pendingAction === "confirm"
                ? t("stores.request.confirm")
                : t("stores.request.reject")}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPendingAction("confirm")}
            >
              {t("stores.request.confirm")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPendingAction("reject")}
            >
              {t("stores.request.reject")}
            </Button>
          </>
        )}
      </div>
    </Container>
  );
};
