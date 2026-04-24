import {
  ListBullet,
  PencilSquare,
  Plus,
  Trash,
  Swatch,
  DropCap,
  InformationCircleSolid,
} from "@medusajs/icons";
import {
  Badge,
  Container,
  Heading,
  Text,
  toast,
  Tooltip,
  usePrompt,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { ProductAttributeDTO, ProductDTO } from "@mercurjs/types";
import { useRemoveAttributeFromProduct } from "../../../../../hooks/api/products";

type ProductWithAttributes = Pick<ProductDTO, "id" | "attributes">;

const AttributeActions = ({
  productId,
  attribute,
}: {
  productId: string;
  attribute: ProductAttributeDTO;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useRemoveAttributeFromProduct(productId, attribute.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteAttributeWarning", {
        title: attribute.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `attributes/${attribute.id}/edit`,
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
    />
  );
};

const AttributeGroup = ({
  icon,
  title,
  description,
  attributes,
  productId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  attributes: ProductAttributeDTO[];
  productId: string;
}) => {
  if (!attributes.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-4 px-3 py-4">
      <div className="flex items-center gap-x-3 px-3">
        <div className="text-ui-fg-muted flex h-8 w-8 items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-component">
          {icon}
        </div>
        <div>
          <Text size="small" weight="plus" leading="compact">
            {title}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {description}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-y-0">
        <div className="overflow-hidden rounded-xl border border-ui-border-base">
          {attributes.map((attr, index) => {
            const values = attr.values?.map((v) => v.name) ?? [];

            return (
              <div
                key={attr.id}
                className={
                  index < attributes.length - 1
                    ? "border-b border-ui-border-base"
                    : ""
                }
              >
                <div className="grid grid-cols-[1fr_1fr_28px] items-center gap-4 px-4 py-3 bg-ui-bg-component">
                  <div className="flex items-center gap-x-2 text-ui-fg-subtle">
                    <Text size="small" weight="plus" leading="compact">
                      {attr.name}
                    </Text>
                    {attr.description && (
                      <Tooltip content={attr.description}>
                        <span className="text-ui-fg-muted flex items-center">
                          <InformationCircleSolid />
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {["single_select", "multi_select"].includes(attr.type) ? (
                      values.map((val) => (
                        <Badge
                          key={val}
                          size="2xsmall"
                          className="flex min-w-[20px] items-center justify-center"
                        >
                          {val}
                        </Badge>
                      ))
                    ) : (
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {values.join(", ") || "-"}
                      </Text>
                    )}
                  </div>

                  <AttributeActions productId={productId} attribute={attr} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ProductAttributeSection = ({
  product,
}: {
  product: ProductWithAttributes;
}) => {
  const { t } = useTranslation();

  const allAttributes = product.attributes ?? [];
  const variantAttributes = allAttributes.filter((a) => a.is_variant_axis);
  const infoAttributes = allAttributes.filter((a) => !a.is_variant_axis);

  const isEmpty = !variantAttributes.length && !infoAttributes.length;

  return (
    <Container className="p-0">
      <div
        className={`flex items-center justify-between px-6 py-4${isEmpty ? "" : " border-b border-ui-border-base"}`}
      >
        <Heading level="h2">{t("products.attributes")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("products.create.attributes.addExisting"),
                  to: "attributes/add",
                  icon: <ListBullet />,
                },
                {
                  label: t("products.create.attributes.createNew"),
                  to: "attributes/create",
                  icon: <Plus />,
                },
              ],
            },
          ]}
        />
      </div>

      {variantAttributes.length > 0 && (
        <AttributeGroup
          icon={<Swatch />}
          title={t("products.create.tabs.variants")}
          description={t("products.attributeVariantsDescription")}
          attributes={variantAttributes}
          productId={product.id}
        />
      )}

      {variantAttributes.length > 0 && infoAttributes.length > 0 && (
        <div className="border-t border-dashed border-ui-border-base" />
      )}

      {infoAttributes.length > 0 && (
        <AttributeGroup
          icon={<DropCap />}
          title={t("products.attributeProductInformation")}
          description={t("products.attributeProductInformationDescription")}
          attributes={infoAttributes}
          productId={product.id}
        />
      )}
    </Container>
  );
};
