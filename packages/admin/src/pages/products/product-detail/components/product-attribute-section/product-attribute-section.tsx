import {
  PencilSquare,
  Swatch,
  DropCap,
  InformationCircleSolid,
} from "@medusajs/icons";
import { Badge, Container, Heading, Text, Tooltip } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { ProductAttributeDTO, ProductDTO } from "@mercurjs/types";

type ProductWithAttributes = Pick<
  ProductDTO,
  "id" | "variant_attributes" | "custom_attributes" | "attribute_values"
>;

const AttributeGroup = ({
  icon,
  title,
  description,
  attributes,
  productAttributeValues,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  attributes: ProductAttributeDTO[];
  productAttributeValues?: ProductDTO["attribute_values"];
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
            const values = getAttributeValues(attr, productAttributeValues);

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

                  <ActionMenu
                    groups={[
                      {
                        actions: [
                          {
                            label: "Edit",
                            to: `attributes/${attr.id}/edit`,
                            icon: <PencilSquare />,
                          },
                        ],
                      },
                    ]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function getAttributeValues(
  attribute: ProductAttributeDTO,
  productAttributeValues?: ProductDTO["attribute_values"],
): string[] {
  if (attribute.is_variant_axis) {
    return attribute.values?.map((v) => v.name) ?? [];
  }

  if (!productAttributeValues) {
    return [];
  }

  return productAttributeValues
    .filter(
      (av) =>
        av.attribute_id === attribute.id || av.attribute?.id === attribute.id,
    )
    .map((av) => av.name);
}

export const ProductAttributeSection = ({
  product,
}: {
  product: ProductWithAttributes;
}) => {
  const { t } = useTranslation();

  const variantAttributes = product.variant_attributes ?? [];
  const variantAttrIds = new Set(variantAttributes.map((a) => a.id));
  const customAttrIds = new Set(
    (product.custom_attributes ?? []).map((a) => a.id),
  );

  // Derive informational attributes from custom_attributes + attribute_values
  // (global non-variant attrs linked via attribute_values won't be in custom_attributes)
  const infoAttributes = [...(product.custom_attributes ?? [])];
  for (const av of product.attribute_values ?? []) {
    const attr = av.attribute;
    if (
      attr &&
      !variantAttrIds.has(attr.id) &&
      !customAttrIds.has(attr.id)
    ) {
      infoAttributes.push(attr);
      customAttrIds.add(attr.id);
    }
  }

  if (!variantAttributes.length && !infoAttributes.length) {
    return null;
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <Heading level="h2">{t("products.attributes")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("products.editAttributes"),
                  to: "attributes/edit",
                  icon: <PencilSquare />,
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
          productAttributeValues={product.attribute_values}
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
          productAttributeValues={product.attribute_values}
        />
      )}
    </Container>
  );
};
