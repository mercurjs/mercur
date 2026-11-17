import { Plus, SquaresPlus } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { ProductAttributeDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../common/action-menu";
import { AttributeGroup } from "../attribute-group";

type VariantWithAttributes = {
  id: string;
  attributes?: ProductAttributeDTO[] | null;
};

export type VariantAttributeSectionProps = {
  variant: VariantWithAttributes;
  onDeleteAttribute: (attribute: ProductAttributeDTO) => Promise<void>;
  getEditHref?: (attribute: ProductAttributeDTO) => string;
  addExistingHref?: string;
};

const defaultEditHref = (attribute: ProductAttributeDTO) =>
  `attributes/${attribute.id}/edit`;

export const VariantAttributeSection = ({
  variant,
  onDeleteAttribute,
  getEditHref = defaultEditHref,
  addExistingHref = "attributes/add",
}: VariantAttributeSectionProps) => {
  const { t } = useTranslation();

  const attributes = variant.attributes ?? [];
  const isEmpty = !attributes.length;

  return (
    <Container className="p-0" data-testid="variant-attribute-section">
      <div
        className={`flex items-center justify-between px-6 py-4${isEmpty ? "" : " border-b border-ui-border-base"}`}
      >
        <Heading level="h2">{t("products.variant.attributes.header")}</Heading>
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
              ],
            },
          ]}
        />
      </div>

      {isEmpty ? (
        <div className="px-6 pb-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("products.variant.attributes.empty")}
          </Text>
        </div>
      ) : (
        <AttributeGroup
          icon={<SquaresPlus />}
          title={t("products.variant.attributes.header")}
          description={t("products.variant.attributes.description")}
          attributes={attributes}
          getEditHref={getEditHref}
          onDelete={onDeleteAttribute}
        />
      )}
    </Container>
  );
};
