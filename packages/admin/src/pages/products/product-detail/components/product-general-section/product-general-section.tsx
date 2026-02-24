import { PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading, StatusBadge, usePrompt } from "@medusajs/ui";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";
import { useDeleteProduct } from "../../../../../hooks/api/products";
import { useExtension } from "../../../../../providers/extension-provider";

const productStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "grey";
    case "proposed":
      return "orange";
    case "published":
      return "green";
    case "rejected":
      return "red";
    default:
      return "grey";
  }
};

type ProductGeneralSectionProps = {
  product: HttpTypes.AdminProduct;
};

export const ProductGeneralSection = ({
  product,
}: ProductGeneralSectionProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();
  const { getDisplays } = useExtension();

  const displays = getDisplays("product", "general");

  const { mutateAsync } = useDeleteProduct(product.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("..");
      },
    });
  };

  return (
    <Container className="divide-y p-0" data-testid="product-general-section">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="product-general-header"
      >
        <Heading data-testid="product-general-title">{product.title}</Heading>
        <div
          className="flex items-center gap-x-4"
          data-testid="product-general-actions"
        >
          <StatusBadge
            color={productStatusColor(product.status)}
            data-testid="product-status-badge"
          >
            {t(`products.productStatus.${product.status}`)}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: "edit",
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: handleDelete,
                    icon: <Trash />,
                  },
                ],
              },
            ]}
            data-testid="product-general-action-menu"
          />
        </div>
      </div>

      <SectionRow
        title={t("fields.description")}
        value={product.description}
        data-testid="product-description-row"
      />
      <SectionRow
        title={t("fields.subtitle")}
        value={product.subtitle}
        data-testid="product-subtitle-row"
      />
      <SectionRow
        title={t("fields.handle")}
        value={`/${product.handle}`}
        data-testid="product-handle-row"
      />
      <SectionRow
        title={t("fields.discountable")}
        value={product.discountable ? t("fields.true") : t("fields.false")}
        data-testid="product-discountable-row"
      />
      {displays.map((Component, index) => {
        return <Component key={index} data={product} />;
      })}
    </Container>
  );
};
