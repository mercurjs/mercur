import { DropCap, PencilSquare, Plus, Swatch, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { SectionRow } from "@components/common/section"
import { useDeleteProductOption, useRemoveProductAttribute } from "@hooks/api/products"
import {
  ExtendedAdminProduct,
  ExtendedAdminProductOption,
  ProductInformationalAttribute,
  ProductInformationalAttributeValue,
} from "../../../types"

type ProductAttributeSectionProps = {
  product: ExtendedAdminProduct
}

const OptionRowActions = ({ productId, option }: { productId: string; option: ExtendedAdminProductOption }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useDeleteProductOption(productId, option.id)
  const canDelete = option.metadata?.author !== "admin"

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.options.deleteWarning", { title: option.title }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })
    if (!res) return
    await mutateAsync(undefined, { onError: (err) => toast.error(err.message) })
  }

  return (
    <ActionMenu
      groups={[
        { actions: [{ icon: <PencilSquare />, label: t("actions.edit"), to: `options/${option.id}/edit` }] },
        ...(canDelete
          ? [{ actions: [{ icon: <Trash />, label: t("actions.delete"), disabled: isPending, onClick: handleDelete }] }]
          : []),
      ]}
    />
  )
}

const InformationalAttributeRowActions = ({ productId, attribute }: { productId: string; attribute: ProductInformationalAttribute }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useRemoveProductAttribute(productId, attribute.attribute_id)
  const isVendorSource = attribute.attribute_source === "vendor"

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: "You are about to remove this attribute from the product. This action cannot be undone.",
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })
    if (!res) return
    await mutateAsync(undefined, { onError: (err) => toast.error(err.message) })
  }

  return (
    <ActionMenu
      groups={[
        { actions: [{ icon: <PencilSquare />, label: t("actions.edit"), to: `informational-attributes/${attribute.attribute_id}/edit` }] },
        ...(isVendorSource
          ? [{ actions: [{ icon: <Trash />, label: t("actions.delete"), disabled: isPending, onClick: handleDelete }] }]
          : []),
      ]}
    />
  )
}

export const ProductAdditionalAttributesSection = ({ product }: ProductAttributeSectionProps) => {
  const { t } = useTranslation()
  const informationalAttributes = product.informational_attributes?.filter(Boolean) ?? []
  const options = product.options?.filter(Boolean) ?? []

  if (!informationalAttributes.length && !options.length) return null

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Heading>{t("products.attributes")}</Heading>
        <ActionMenu groups={[{ actions: [{ label: t("actions.add"), to: "attributes/add", icon: <Plus /> }] }]} />
      </div>

      {options.length > 0 && (
        <div className="px-3 py-4">
          <div className="flex items-center gap-x-3 px-3 pb-4">
            <div className="flex size-7 items-center justify-center rounded-md bg-ui-bg-base shadow-borders-base">
              <div className="flex size-6 items-center justify-center rounded-[4px] bg-ui-bg-component">
                <Swatch className="text-ui-fg-subtle" />
              </div>
            </div>
            <div>
              <Text size="small" weight="plus" leading="compact">{t("products.options.variations.label")}</Text>
              <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">{t("products.options.variations.description")}</Text>
            </div>
          </div>
          <div className="divide-y overflow-hidden rounded-lg border">
            {options.map((option) => (
              <SectionRow
                key={option.id}
                title={option.title}
                actions={<OptionRowActions productId={product.id} option={option} />}
                className="bg-ui-bg-component p-3"
                value={option.values?.map((value, index) => (
                  <Badge key={`${option.id}-${value.value}-${index}`} size="2xsmall" className="flex min-w-[20px] items-center justify-center">
                    {value.value}
                  </Badge>
                ))}
                tooltip={option.metadata?.author === "admin" ? t("products.edit.attributes.required") : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {options.length > 0 && informationalAttributes.length > 0 && (
        <div className="border-t border-dashed border-ui-border-base" />
      )}

      {informationalAttributes.length > 0 && (
        <div className="px-3 py-4">
          <div className="flex items-center gap-x-3 px-3 pb-4">
            <div className="flex size-7 items-center justify-center rounded-md bg-ui-bg-base shadow-borders-base">
              <div className="flex size-6 items-center justify-center rounded-[4px] bg-ui-bg-component">
                <DropCap className="text-ui-fg-subtle" />
              </div>
            </div>
            <div>
              <Text size="small" weight="plus" leading="compact">{t("products.edit.informationalAttributes.header")}</Text>
              <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">{t("products.edit.informationalAttributes.description")}</Text>
            </div>
          </div>
          <div className="divide-y overflow-hidden rounded-lg border">
            {informationalAttributes.map((attribute) => (
              <SectionRow
                key={`${attribute.attribute_id}-${attribute.attribute_source}`}
                title={attribute.name}
                actions={<InformationalAttributeRowActions productId={product.id} attribute={attribute} />}
                className="bg-ui-bg-component p-3 [&>p]:gap-x-1"
                value={attribute.values?.length ? attribute.values.map((v: ProductInformationalAttributeValue) => v.value).join(", ") : "-"}
                tooltip={attribute.is_required ? t("products.edit.attributes.required") : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
