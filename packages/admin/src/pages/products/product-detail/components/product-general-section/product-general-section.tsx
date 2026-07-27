import { PencilSquare, Trash } from "@medusajs/icons";
import { Container, Heading, StatusBadge, usePrompt } from "@medusajs/ui";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";
import { useDeleteProduct } from "../../../../../hooks/api/products";

const GENERAL_FIELD_IDS = [
  "title",
  "status",
  "description",
  "subtitle",
  "handle",
  "discountable",
];

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

export const ProductGeneralSection = ({
  product,
}: {
  product: HttpTypes.AdminProduct;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();

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
        <DisplayField model="product" zone="general" id="title" data={product}>
          <Heading data-testid="product-general-title">{product.title}</Heading>
        </DisplayField>
        <div
          className="flex items-center gap-x-4"
          data-testid="product-general-actions"
        >
          <DisplayField
            model="product"
            zone="general"
            id="status"
            data={product}
          >
            <StatusBadge
              color={productStatusColor(product.status)}
              data-testid="product-status-badge"
            >
              {t(`products.productStatus.${product.status}`)}
            </StatusBadge>
          </DisplayField>
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

      <DisplayField model="product" zone="general" id="description" data={product}>
        <SectionRow
          title={t("fields.description")}
          value={product.description}
          data-testid="product-description-row"
        />
      </DisplayField>
      <DisplayField model="product" zone="general" id="subtitle" data={product}>
        <SectionRow
          title={t("fields.subtitle")}
          value={product.subtitle}
          data-testid="product-subtitle-row"
        />
      </DisplayField>
      <DisplayField model="product" zone="general" id="handle" data={product}>
        <SectionRow
          title={t("fields.handle")}
          value={`/${product.handle}`}
          data-testid="product-handle-row"
        />
      </DisplayField>
      <DisplayField
        model="product"
        zone="general"
        id="discountable"
        data={product}
      >
        <SectionRow
          title={t("fields.discountable")}
          value={product.discountable ? t("fields.true") : t("fields.false")}
          data-testid="product-discountable-row"
        />
      </DisplayField>
      <DisplayExtensionZone
        model="product"
        zone="general"
        data={product}
        builtInFieldIds={GENERAL_FIELD_IDS}
      />
    </Container>
  );
};
