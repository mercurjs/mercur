import { PencilSquare, Plus, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDeleteProductOption } from "../../../../../hooks/api/products"
import { HttpTypes } from "@medusajs/types"

const OptionActions = ({
  product,
  option,
}: {
  product: HttpTypes.AdminProduct
  option: HttpTypes.AdminProductOption
}) => {
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteProductOption(product.id, option.id)
  const prompt = usePrompt()

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.options.deleteWarning", {
        title: option.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync()
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `options/${option.id}/edit`,
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
      data-testid={`product-option-actions-${option.id}`}
    />
  )
}

type ProductOptionSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductOptionSection = ({
  product,
}: ProductOptionSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0" data-testid="product-option-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="product-option-header">
        <Heading level="h2" data-testid="product-option-title">{t("products.options.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.create"),
                  to: "options/create",
                  icon: <Plus />,
                },
              ],
            },
          ]}
          data-testid="product-option-action-menu"
        />
      </div>

      {product.options?.map((option) => {
        return (
          <SectionRow
            title={option.title}
            key={option.id}
            value={option.values?.map((val) => {
              return (
                <Badge
                  key={val.value}
                  size="2xsmall"
                  className="flex min-w-[20px] items-center justify-center"
                  data-testid={`product-option-value-badge-${option.id}-${val.value}`}
                >
                  {val.value}
                </Badge>
              )
            })}
            actions={<OptionActions product={product} option={option} />}
            data-testid={`product-option-row-${option.id}`}
          />
        )
      })}
    </Container>
  )
}
