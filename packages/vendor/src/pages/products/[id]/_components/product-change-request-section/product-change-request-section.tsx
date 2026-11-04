import { ExclamationCircleSolid } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HttpTypes } from "@mercurjs/types";

import { useDate } from "@hooks/use-date";

type ProductChangeRequestSectionProps = {
  product: HttpTypes.VendorProductResponse["product"];
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="txt-small text-ui-fg-subtle flex flex-row px-6 py-4">
    <span className="flex-1 font-medium">{label}</span>
    <div className="flex flex-1 items-center">{children}</div>
  </div>
);

export const ProductChangeRequestSection = ({
  product,
}: ProductChangeRequestSectionProps) => {
  const { t } = useTranslation();
  const { getFullDate } = useDate();

  const changeRequest = product.change_request;
  if (!changeRequest) {
    return null;
  }

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
    >
      <Container
        className="divide-y divide-dashed p-0"
        data-testid="product-change-request-section"
      >
        <div className="flex items-center gap-2 px-6 py-4">
          <ExclamationCircleSolid className="text-ui-tag-orange-icon" />
          <Heading level="h2" data-testid="product-change-request-heading">
            {t("products.changeRequest.title")}
          </Heading>
        </div>
        <Row label={t("products.changeRequest.message")}>
          <Text
            size="small"
            leading="compact"
            className="text-pretty whitespace-pre-line"
            data-testid="product-change-request-message"
          >
            {changeRequest.message ?? t("products.changeRequest.noMessage")}
          </Text>
        </Row>
        <Row label={t("products.changeRequest.requestedAt")}>
          {getFullDate({ date: changeRequest.requested_at, includeTime: true })}
        </Row>
        <div className="txt-small text-ui-fg-subtle px-6 py-4">
          {t("products.changeRequest.hint")}
        </div>
      </Container>
    </div>
  );
};
