import { InformationCircleSolid, PencilSquare, Trash } from "@medusajs/icons";
import { Badge, Text, Tooltip, usePrompt } from "@medusajs/ui";
import { ProductAttributeDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../common/action-menu";
import { IconAvatar } from "../common/icon-avatar";

type AttributeActionsProps = {
  attribute: ProductAttributeDTO;
  editHref: string;
  onDelete: (attribute: ProductAttributeDTO) => Promise<void>;
};

const AttributeActions = ({
  attribute,
  editHref,
  onDelete,
}: AttributeActionsProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();

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

    await onDelete(attribute);
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: editHref,
              permission: "products:edit" as const,
              icon: <PencilSquare />,
            },
          ],
        },
        ...(attribute.is_required
          ? []
          : [
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: handleDelete,
                    permission: "products:edit" as const,
                    icon: <Trash />,
                  },
                ],
              },
            ]),
      ]}
    />
  );
};

const AttributeValue = ({ attribute }: { attribute: ProductAttributeDTO }) => {
  const { t } = useTranslation();
  const values = attribute.values?.map((v) => v.name) ?? [];

  if (attribute.is_required && !values.length) {
    return (
      <Text
        size="small"
        leading="compact"
        className="text-ui-fg-error"
        data-testid={`product-missing-required-attribute-${attribute.id}`}
      >
        {t("products.missingRequiredAttributesHint")}
      </Text>
    );
  }

  if (["single_select", "multi_select"].includes(attribute.type)) {
    return (
      <div className="flex flex-wrap gap-1">
        {values.map((val) => (
          <Badge
            key={val}
            size="2xsmall"
            className="flex min-w-[20px] items-center justify-center"
          >
            {val}
          </Badge>
        ))}
      </div>
    );
  }

  const textValue =
    attribute.type === "toggle"
      ? values
          .map((val) => (val === "true" ? t("general.yes") : t("general.no")))
          .join(", ") || "-"
      : values.join(", ") || "-";

  return (
    <Tooltip content={<span className="break-all">{textValue}</span>}>
      <Text
        size="small"
        leading="compact"
        className="line-clamp-3 min-w-0 break-words text-ui-fg-subtle"
      >
        {textValue}
      </Text>
    </Tooltip>
  );
};

export type AttributeGroupProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  attributes: ProductAttributeDTO[];
  getEditHref: (attribute: ProductAttributeDTO) => string;
  onDelete: (attribute: ProductAttributeDTO) => Promise<void>;
};

export const AttributeGroup = ({
  icon,
  title,
  description,
  attributes,
  getEditHref,
  onDelete,
}: AttributeGroupProps) => {
  const { t } = useTranslation();

  if (!attributes.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-4 px-3 py-4">
      <div className="flex items-center gap-x-3 px-3">
        <IconAvatar>{icon}</IconAvatar>
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
            return (
              <div
                key={attr.id}
                className={
                  index < attributes.length - 1
                    ? "border-b border-ui-border-base"
                    : ""
                }
              >
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] items-center gap-4 px-3 py-2 bg-ui-bg-component">
                  <div className="flex items-center gap-x-2 text-ui-fg-subtle">
                    <Text size="small" weight="plus" leading="compact">
                      {attr.name}
                    </Text>
                    {attr.is_internal && (
                      <Badge size="2xsmall" color="blue">
                        {t("attributes.fields.visibility.internal")}
                      </Badge>
                    )}
                    {attr.description && (
                      <Tooltip content={attr.description}>
                        <span className="text-ui-fg-muted flex items-center">
                          <InformationCircleSolid />
                        </span>
                      </Tooltip>
                    )}
                    {attr.is_required && (
                      <Tooltip
                        content={t("products.attributeRequiredByMarketplace")}
                      >
                        <span className="text-ui-fg-muted flex items-center">
                          <InformationCircleSolid />
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  <AttributeValue attribute={attr} />

                  <AttributeActions
                    attribute={attr}
                    editHref={getEditHref(attr)}
                    onDelete={onDelete}
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
