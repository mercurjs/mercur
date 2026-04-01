import { PencilSquare, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { AttributeDTO } from "@mercurjs/types"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section/section-row"
import { useDeleteAttribute } from "../../../../../hooks/api"

type AttributeGeneralSectionProps = {
  attribute: AttributeDTO & {
    product_categories?: Array<{ id: string; name: string }>
  }
}

export const AttributeGeneralSection = ({
  attribute,
}: AttributeGeneralSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteAttribute(attribute.id)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("attributes.delete.confirmation", {
        name: attribute.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("attributes.delete.successToast", { name: attribute.name })
        )
        navigate("/settings/attributes", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const typeLabel =
    t(`attributes.type.${attribute.ui_component}`, attribute.ui_component) ??
    attribute.ui_component

  return (
    <Container
      className="divide-y p-0"
      data-testid="attribute-general-section-container"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="attribute-general-section-header"
      >
        <Heading data-testid="attribute-general-section-heading">
          {attribute.name}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "edit",
                },
              ],
            },
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  onClick: handleDelete,
                },
              ],
            },
          ]}
          data-testid="attribute-general-section-action-menu"
        />
      </div>

      <SectionRow
        title={t("attributes.fields.handle")}
        value={attribute.handle ? `/${attribute.handle}` : "-"}
        data-testid="attribute-general-section-handle"
      />

      <SectionRow
        title={t("attributes.fields.description")}
        value={attribute.description || "-"}
        data-testid="attribute-general-section-description"
      />

      <SectionRow
        title={t("attributes.fields.type")}
        value={typeLabel}
        data-testid="attribute-general-section-type"
      />

      <SectionRow
        title={t("attributes.fields.filterable")}
        value={
          attribute.is_filterable ? t("fields.true") : t("fields.false")
        }
        data-testid="attribute-general-section-filterable"
      />

      <SectionRow
        title={t("attributes.fields.required")}
        value={
          attribute.is_required ? t("fields.true") : t("fields.false")
        }
        data-testid="attribute-general-section-required"
      />

      <SectionRow
        title={t("attributes.fields.global")}
        value={
          attribute.product_categories && attribute.product_categories.length > 0
            ? t("fields.false")
            : t("fields.true")
        }
        data-testid="attribute-general-section-global"
      />

      <SectionRow
        title={t("attributes.fields.category")}
        value={
          attribute.product_categories && attribute.product_categories.length > 0 ? (
            <div
              className="flex flex-wrap gap-1"
              data-testid="attribute-general-section-categories"
            >
              {attribute.product_categories.map((category: any) => (
                <Badge key={category.id} size="2xsmall">
                  {category.name}
                </Badge>
              ))}
            </div>
          ) : (
            "-"
          )
        }
        data-testid="attribute-general-section-categories-row"
      />
    </Container>
  )
}
