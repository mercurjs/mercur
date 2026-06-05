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
  useSellerMembers,
  useSuspendSeller,
} from "../../../../hooks/api/sellers";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreRequestSectionProps = {
  seller: Seller;
};

type OwnerMember = {
  is_owner?: boolean;
  member?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

export const StoreRequestSection = ({ seller }: StoreRequestSectionProps) => {
  const { t } = useTranslation();

  const { mutateAsync: approveSeller, isPending: isApproving } =
    useApproveSeller(seller.id);
  const { mutateAsync: suspendSeller, isPending: isRejecting } =
    useSuspendSeller(seller.id);

  const { seller_members } = useSellerMembers(seller.id, { limit: 100 });
  const owner = (seller_members as OwnerMember[] | undefined)?.find(
    (m) => m.is_owner,
  );
  const ownerFullName = [owner?.member?.first_name, owner?.member?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const requesterLabel =
    ownerFullName || owner?.member?.email || seller.email || seller.name;

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
              {t("stores.request.confirm")}
            </Button>
          }
          title={t("stores.request.confirmTitle", "Confirm request")}
          description={t(
            "stores.request.confirmDescription",
            "You are about to confirm this store request.",
          )}
          confirmLabel={t("stores.request.confirm")}
          notePlaceholder={t(
            "stores.request.confirmNotePlaceholder",
            "Specify changes you made or additional requests",
          )}
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
        <RequestActionPrompt
          trigger={
            <Button size="small" variant="secondary">
              {t("stores.request.reject")}
            </Button>
          }
          title={t("stores.request.rejectTitle", "Reject request")}
          description={t(
            "stores.request.rejectDescription",
            "You are about to reject this store request.",
          )}
          confirmLabel={t("stores.request.reject")}
          notePlaceholder={t(
            "stores.request.rejectNotePlaceholder",
            "Explain why you reject the request or suggest changes",
          )}
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
      </div>
    </Container>
  );
};

type RequestActionPromptProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  notePlaceholder: string;
  confirmLabel: string;
  isLoading: boolean;
  onConfirm: (note: string) => Promise<void>;
};

const RequestActionPrompt = ({
  trigger,
  title,
  description,
  notePlaceholder,
  confirmLabel,
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
    <Prompt open={open} onOpenChange={setOpen}>
      <Prompt.Trigger asChild>{trigger}</Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>{title}</Prompt.Title>
          <Prompt.Description>{description}</Prompt.Description>
        </Prompt.Header>
        <div className="border-ui-border-base border-t mt-3" />
        <div className="flex flex-col gap-y-3 px-6 py-3">
          <Text size="small" weight="plus" className="text-ui-fg-base">
            {t("stores.request.noteLabel", "Notes for vendor")}{" "}
            <span className="text-ui-fg-muted font-normal">
              ({t("fields.optional", "Optional")})
            </span>
          </Text>
          <Textarea
            placeholder={notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="border-ui-border-base border-t mt-2" />
        <Prompt.Footer>
          <Prompt.Cancel disabled={isLoading}>
            {t("actions.cancel")}
          </Prompt.Cancel>
          <Button
            size="small"
            variant="primary"
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
