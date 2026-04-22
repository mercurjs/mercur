import { ReactNode, useState } from "react";
import { ExclamationCircleSolid } from "@medusajs/icons";
import {
  Button,
  Container,
  Heading,
  Prompt,
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

  const { mutateAsync: approveSeller, isPending: isApproving } =
    useApproveSeller(seller.id);
  const { mutateAsync: suspendSeller, isPending: isRejecting } =
    useSuspendSeller(seller.id);

  const requesterLabel = seller.email || seller.name;

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
      <div className="flex items-center justify-end gap-x-2 rounded-b-lg border-t border-ui-border-base bg-ui-bg-subtle px-6 py-4">
        <RequestActionPrompt
          trigger={
            <Button size="small" variant="secondary">
              {t("stores.request.reject")}
            </Button>
          }
          title={t("stores.request.rejectTitle", "Reject store request")}
          description={t(
            "stores.request.rejectDescription",
            "Provide an optional reason. The vendor will be notified.",
          )}
          confirmLabel={t("stores.request.reject")}
          confirmVariant="danger"
          isLoading={isRejecting}
          onConfirm={async (note) => {
            try {
              await suspendSeller({ reason: note || undefined });
              toast.success(t("stores.request.rejectSuccess"));
            } catch (error) {
              toast.error((error as Error).message);
              throw error;
            }
          }}
        />
        <RequestActionPrompt
          trigger={
            <Button size="small" variant="primary">
              {t("stores.request.confirm")}
            </Button>
          }
          title={t("stores.request.confirmTitle", "Approve store request")}
          description={t(
            "stores.request.confirmDescription",
            "Provide an optional note for the vendor.",
          )}
          confirmLabel={t("stores.request.confirm")}
          confirmVariant="primary"
          isLoading={isApproving}
          onConfirm={async (_note) => {
            try {
              await approveSeller();
              toast.success(t("stores.request.confirmSuccess"));
            } catch (error) {
              toast.error((error as Error).message);
              throw error;
            }
          }}
        />
      </div>
    </Container>
  );
};

type RequestActionPromptProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "danger" | "primary";
  isLoading: boolean;
  onConfirm: (note: string) => Promise<void>;
};

const RequestActionPrompt = ({
  trigger,
  title,
  description,
  confirmLabel,
  confirmVariant,
  isLoading,
  onConfirm,
}: RequestActionPromptProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    try {
      await onConfirm(note);
      setOpen(false);
      setNote("");
    } catch {
      /* toast handled by caller */
    }
  };

  return (
    <Prompt open={open} onOpenChange={setOpen} variant={confirmVariant}>
      <Prompt.Trigger asChild>{trigger}</Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>{title}</Prompt.Title>
          <Prompt.Description>{description}</Prompt.Description>
        </Prompt.Header>
        <div className="flex flex-col gap-y-2 px-6 pb-4">
          <Text size="small" weight="plus" className="text-ui-fg-subtle">
            {t("stores.request.noteLabel", "Note")}{" "}
            <span className="text-ui-fg-muted font-normal">
              ({t("fields.optional", "Optional")})
            </span>
          </Text>
          <Textarea
            placeholder={t("stores.request.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Prompt.Footer>
          <Prompt.Cancel disabled={isLoading}>
            {t("actions.cancel")}
          </Prompt.Cancel>
          <Button
            size="small"
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};
