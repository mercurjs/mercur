import { DropCap, PencilSquare, Plus, Swatch } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { ProductAttributeDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../common/action-menu";
import { DisplayExtensionZone } from "../../../extensions";
import { AttributeGroup } from "../attribute-group";

type ProductWithAttributes = {
  id: string;
  attributes?: ProductAttributeDTO[] | null;
};

export type ProductAttributeSectionProps = {
  product: ProductWithAttributes;
  requiredAttributes?: ProductAttributeDTO[];
  onDeleteAttribute: (attribute: ProductAttributeDTO) => Promise<void>;
  getEditHref?: (attribute: ProductAttributeDTO) => string;
  addExistingHref?: string;
  createNewHref?: string;
};

const defaultEditHref = (attribute: ProductAttributeDTO) =>
  `attributes/${attribute.id}/edit`;

export const ProductAttributeSection = ({
  product,
  requiredAttributes,
  onDeleteAttribute,
  getEditHref = defaultEditHref,
  addExistingHref = "attributes/add",
  createNewHref = "attributes/create",
}: ProductAttributeSectionProps) => {
  const { t } = useTranslation();

  const attributes = product.attributes ?? [];
  const attachedIds = new Set(attributes.map((a) => a.id));

  const missing = (requiredAttributes ?? [])
    .filter((required) => !attachedIds.has(required.id))
    .map(
      (required) =>
        ({
          ...required,
          values: [],
          is_required: true,
        }) as unknown as ProductAttributeDTO,
    );

  const allAttributes = [...attributes, ...missing];
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
                  to: addExistingHref,
                  permission: "products:edit" as const,
                  icon: <Plus />,
                },
                {
                  label: t("products.create.attributes.createNew"),
                  to: createNewHref,
                  permission: "products:edit" as const,
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
          title={t("products.attributeVariations")}
          description={t("products.attributeVariantsDescription")}
          attributes={variantAttributes}
          getEditHref={getEditHref}
          onDelete={onDeleteAttribute}
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
          getEditHref={getEditHref}
          onDelete={onDeleteAttribute}
        />
      )}
      <DisplayExtensionZone model="product" zone="attributes" data={product} />
    </Container>
  );
};
