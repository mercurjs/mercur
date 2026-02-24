import { PencilSquare, Plus, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "@components/common/action-menu"
import { SectionRow } from "@components/common/section"
import { useDeleteProductOption } from "@hooks/api/products"
import { HttpTypes } from "@medusajs/types"
import { useProductDetailContext } from "../../context"

const OptionActions = ({
  option,
}: {
  option: HttpTypes.AdminProductOption
}) => {
  const { product } = useProductDetailContext()
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
    />
  )
}

export const ProductOptionSection = () => {
  const { product } = useProductDetailContext()
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.options.header")}</Heading>
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
                >
                  {val.value}
                </Badge>
              )
            })}
            actions={<OptionActions option={option} />}
          />
        )
      })}
    </Container>
  )
}
