import { Component, PencilSquare, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { HttpTypes } from "@medusajs/types"
import { ProductAttributeValueDTO } from "@mercurjs/types"

import { ActionMenu } from "@components/common/action-menu"
import { SectionRow } from "@components/common/section"
import { useDeleteVariant } from "@hooks/api/products"

export function VariantGeneralSection({
  variant,
}: {
  variant: HttpTypes.AdminProductVariant
}) {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const hasInventoryKit = (variant.inventory_items?.length ?? 0) > 1

  const { mutateAsync } = useDeleteVariant(variant.product_id!, variant.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.variant.deleteWarning", {
        title: variant.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("..", { replace: true })
      },
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Heading>{variant.title}</Heading>
            {hasInventoryKit && (
              <span className="text-ui-fg-muted font-normal">
                <Component />
              </span>
            )}
          </div>
          <span className="text-ui-fg-subtle txt-small mt-2">
            {t("labels.productVariant")}
          </span>
        </div>
        <div className="flex items-center gap-x-4">
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
          />
        </div>
      </div>

      <SectionRow title={t("fields.sku")} value={variant.sku} />
      {(
        (
          variant as HttpTypes.AdminProductVariant & {
            attribute_values?: ProductAttributeValueDTO[]
          }
        ).attribute_values ?? []
      )
        .reduce<{ id: string; title: string; values: string[] }[]>(
          (acc, value) => {
            const attribute = value.attribute
            if (!attribute) return acc

            const existing = acc.find((g) => g.id === attribute.id)
            if (existing) {
              existing.values.push(value.name)
            } else {
              acc.push({
                id: attribute.id,
                title: attribute.name,
                values: [value.name],
              })
            }
            return acc
          },
          []
        )
        .map((group) => (
          <SectionRow
            key={group.id}
            title={group.title}
            value={
              <div className="flex flex-wrap items-center gap-1">
                {group.values.map((v) => (
                  <Badge key={v} size="2xsmall">
                    {v}
                  </Badge>
                ))}
              </div>
            }
          />
        ))}
    </Container>
  )
}
