import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import {
  Badge,
  Prompt,
  Switch,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { PencilSquare, Trash } from "@medusajs/icons"
import { ProductAttributeDTO } from "@mercurjs/types"
import { TextCell } from "../../../components/table/table-cells/common/text-cell"
import { ActionMenu } from "../../../components/common/action-menu"
import {
  useDeleteProductAttribute,
  useUpdateProductAttribute,
} from "../../../hooks/api/product-attributes"

const MAX_VISIBLE_VALUES = 2

// --- Type label helper ---

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  single_select: "attributes.type.select",
  multi_select: "attributes.type.multivalue",
  unit: "attributes.type.unit",
  toggle: "attributes.type.toggle",
  text: "attributes.type.text_area",
}

// --- Filterable Toggle ---

const FilterableToggle = ({
  attribute,
}: {
  attribute: ProductAttributeDTO
}) => {
  const { mutateAsync } = useUpdateProductAttribute(attribute.id)

  const handleToggle = async (checked: boolean) => {
    try {
      await mutateAsync({ is_filterable: checked })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <Switch
        checked={!!attribute.is_filterable}
        onCheckedChange={handleToggle}
        size="small"
      />
    </div>
  )
}

// --- Required Toggle ---

const RequiredToggle = ({
  attribute,
}: {
  attribute: ProductAttributeDTO
}) => {
  const { mutateAsync } = useUpdateProductAttribute(attribute.id)

  const handleToggle = async (checked: boolean) => {
    try {
      await mutateAsync({ is_required: checked })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <Switch
        checked={!!attribute.is_required}
        onCheckedChange={handleToggle}
        size="small"
      />
    </div>
  )
}

// --- Delete Actions ---

const AttributeActions = ({
  attribute,
}: {
  attribute: ProductAttributeDTO
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteProductAttribute(attribute.id)
  const [inUseOpen, setInUseOpen] = useState(false)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("attributes.delete.confirmation", {
        name: attribute.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) return

    try {
      await mutateAsync(undefined)
      toast.success(
        t("attributes.delete.successToast", { name: attribute.name })
      )
    } catch (err: any) {
      const isInUse = err.message?.includes("can't be deleted")

      if (isInUse) {
        setInUseOpen(true)
      } else {
        toast.error(err.message)
      }
    }
  }

  return (
    <>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                label: t("actions.edit"),
                to: `${attribute.id}/edit`,
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
      {createPortal(
        <Prompt open={inUseOpen} variant="confirmation">
          <Prompt.Content>
            <Prompt.Header>
              <Prompt.Title>{t("attributes.delete.title")}</Prompt.Title>
              <Prompt.Description>
                {t("attributes.delete.inUseMessage", {
                  name: attribute.name,
                })}
              </Prompt.Description>
            </Prompt.Header>
            <Prompt.Footer>
              <Prompt.Action onClick={() => setInUseOpen(false)}>
                {t("attributes.delete.gotIt")}
              </Prompt.Action>
            </Prompt.Footer>
          </Prompt.Content>
        </Prompt>,
        document.body
      )}
    </>
  )
}

// --- Columns ---

const columnHelper = createColumnHelper<ProductAttributeDTO>()

export const useAttributeTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => t("attributes.fields.name"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("handle", {
        header: () => t("attributes.fields.handle"),
        cell: ({ getValue }) => {
          const handle = getValue()
          return <TextCell text={handle ? `/${handle}` : "-"} />
        },
      }),
      columnHelper.accessor("is_required", {
        header: () => t("attributes.fields.required"),
        cell: ({ row }) => <RequiredToggle attribute={row.original} />,
      }),
      columnHelper.accessor("is_filterable", {
        header: () => t("attributes.fields.filterable"),
        cell: ({ row }) => (
          <FilterableToggle attribute={row.original} />
        ),
      }),
      columnHelper.accessor("type", {
        header: () => t("attributes.fields.type"),
        cell: ({ getValue }) => {
          const type = getValue()
          const labelKey = ATTRIBUTE_TYPE_LABELS[type]
          return <TextCell text={labelKey ? t(labelKey) : type} />
        },
      }),
      columnHelper.accessor("is_variant_axis", {
        header: () => t("attributes.fields.variantAxis"),
        cell: ({ getValue }) => (
          <TextCell text={getValue() ? t("filters.radio.yes") : t("filters.radio.no")} />
        ),
      }),
      columnHelper.display({
        id: "values",
        header: () => t("attributes.fields.values"),
        cell: ({ row }) => {
          const values = row.original.values ?? []
          if (!values.length) {
            return <span className="text-ui-fg-muted">-</span>
          }
          const visible = values.slice(0, MAX_VISIBLE_VALUES)
          const remaining = values.length - MAX_VISIBLE_VALUES
          return (
            <div className="flex items-center gap-x-1">
              {visible.map((v) => (
                <Badge key={v.id} size="2xsmall" color="grey">
                  {v.name}
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge size="2xsmall" color="grey">
                  +{remaining}
                </Badge>
              )}
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <AttributeActions attribute={row.original} />
        ),
      }),
    ],
    [t]
  )
}
