import { useState } from "react";
import { Button, Container, Heading, toast } from "@medusajs/ui";
import { ExclamationCircleSolid } from "@medusajs/icons";
import { useTranslation } from "react-i18next";

import { HttpTypes } from "@medusajs/types";
import { ProductStatus, SellerDTO } from "@mercurjs/types";
import { ConfirmPrompt } from "../../../../../components/common/confirm-prompt";
import {
  usePublishProduct,
  useRejectProduct,
  useRequestProductChanges,
} from "../../../../../hooks/api/products";

type ProductWithSellers = HttpTypes.AdminProduct & {
  sellers?: SellerDTO[];
};

type ProductActiveRequestSectionProps = {
  product: ProductWithSellers;
};

export const ProductActiveRequestSection = ({
  product,
}: ProductActiveRequestSectionProps) => {
  const { t } = useTranslation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestUpdateOpen, setRequestUpdateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { mutateAsync: publishProduct, isPending: isPublishing } =
    usePublishProduct(product.id);
  const { mutateAsync: requestProductChanges, isPending: isRequestingUpdate } =
    useRequestProductChanges(product.id);
  const { mutateAsync: rejectProduct, isPending: isRejecting } =
    useRejectProduct(product.id);

  if (product.status !== ProductStatus.PROPOSED) {
    return null;
  }

  const handleConfirm = async (note: string | undefined) => {
    try {
      await publishProduct({ internal_note: note });
      toast.success(t("products.request.toast.publishedSuccessfully"));
      setConfirmOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRequestUpdate = async (note: string | undefined) => {
    try {
      await requestProductChanges({ message: note });
      toast.success(t("products.request.toast.updateRequestedSuccessfully"));
      setRequestUpdateOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleReject = async (note: string | undefined) => {
    try {
      await rejectProduct({ message: note });
      toast.success(t("products.request.toast.rejectedSuccessfully"));
      setRejectOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
      data-testid="product-active-request-section"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-col divide-y divide-dashed">
          <div
            className="flex items-center gap-2 px-6 py-4"
            data-testid="product-active-request-header"
          >
            <ExclamationCircleSolid className="text-blue-500" />
            <Heading level="h2" data-testid="product-active-request-heading">
              {t("products.request.panel.title")}
            </Heading>
          </div>

          <div className="txt-small text-ui-fg-subtle px-6 py-4">
            {t("products.request.panel.description", {
              store:
                product.sellers?.[0]?.name ??
                t("products.request.fallbackStore"),
            })}
          </div>

          <div
            className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4"
            data-testid="product-active-request-actions"
          >
            <Button
              size="small"
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
              data-testid="product-active-request-confirm-button"
            >
              {t("actions.confirm")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setRequestUpdateOpen(true)}
              data-testid="product-active-request-request-update-button"
            >
              {t("products.request.actions.requestUpdate")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setRejectOpen(true)}
              data-testid="product-active-request-reject-button"
            >
              {t("products.request.actions.reject")}
            </Button>
          </div>
        </div>
      </Container>

      <ConfirmPrompt
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("products.request.confirmPrompt.title")}
        description={t("products.request.confirmPrompt.description")}
        noteLabel={t("products.request.confirmPrompt.noteLabel")}
        noteOptional
        notePlaceholder={t("products.request.confirmPrompt.notePlaceholder")}
        isLoading={isPublishing}
        onConfirm={handleConfirm}
      />

      <ConfirmPrompt
        open={requestUpdateOpen}
        onOpenChange={setRequestUpdateOpen}
        title={t("products.request.requestUpdatePrompt.title")}
        description={t("products.request.requestUpdatePrompt.description")}
        noteLabel={t("products.request.requestUpdatePrompt.noteLabel")}
        noteOptional
        notePlaceholder={t(
          "products.request.requestUpdatePrompt.notePlaceholder",
        )}
        confirmLabel={t("products.request.requestUpdatePrompt.send")}
        isLoading={isRequestingUpdate}
        onConfirm={handleRequestUpdate}
      />

      <ConfirmPrompt
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t("products.request.rejectPrompt.title")}
        description={t("products.request.rejectPrompt.description")}
        noteLabel={t("products.request.rejectPrompt.noteLabel")}
        noteOptional
        notePlaceholder={t("products.request.rejectPrompt.notePlaceholder")}
        confirmLabel={t("products.request.rejectPrompt.confirm")}
        isLoading={isRejecting}
        onConfirm={handleReject}
      />
    </div>
  );
};
