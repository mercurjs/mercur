import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import {
  Badge,
  Button,
  Heading,
  Prompt,
  Switch,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { PencilSquare, Trash } from "@medusajs/icons"
import { TextCell } from "../../../components/table/table-cells/common/text-cell"
import { ActionMenu } from "../../../components/common/action-menu"
import { Combobox } from "../../../components/inputs/combobox"
import {
  useDeleteAttribute,
  useUpdateAttribute,
} from "../../../hooks/api/attributes"
import { useProductCategories } from "../../../hooks/api"

const MAX_VISIBLE_VALUES = 2

// --- Filterable Toggle ---

const FilterableToggle = ({ attribute }: { attribute: Record<string, any> }) => {
  const { mutateAsync } = useUpdateAttribute(attribute.id)

  const handleToggle = async (checked: boolean) => {
    try {
      await mutateAsync({ is_filterable: checked })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <Switch
        checked={!!attribute.is_filterable}
        onCheckedChange={handleToggle}
        size="small"
      />
    </div>
  )
}

// --- Global Toggle with Category Modal ---

const GlobalToggle = ({ attribute }: { attribute: Record<string, any> }) => {
  const { t } = useTranslation()
  const { mutateAsync } = useUpdateAttribute(attribute.id)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const categories = attribute.product_categories ?? []
  const isGlobal = !categories.length

  const { product_categories: allCategories } = useProductCategories({
    limit: 999,
  })

  const categoryOptions = (allCategories ?? []).map((cat: any) => ({
    label: cat.name,
    value: cat.id,
  }))

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // Turning ON global — remove category assignments
      try {
        await mutateAsync({ product_category_ids: [] })
      } catch (err: any) {
        toast.error(err.message)
      }
    } else {
      // Turning OFF global — need to pick categories
      setSelectedCategoryIds(categories.map((c: any) => c.id))
      setCategoryModalOpen(true)
    }
  }

  const handleSaveCategory = async () => {
    if (!selectedCategoryIds.length) return

    try {
      await mutateAsync({
        product_category_ids: selectedCategoryIds,
      })
      setCategoryModalOpen(false)
      setSelectedCategoryIds([])
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <div onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
        <Switch
          checked={isGlobal}
          onCheckedChange={handleToggle}
          size="small"
        />
      </div>
      {categoryModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <div
              className="bg-ui-bg-overlay fixed inset-0"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
            <div className="bg-ui-bg-base shadow-elevation-flyout relative flex w-full max-w-[400px] flex-col rounded-lg border">
              <div className="flex flex-col gap-y-1 px-6 pt-6">
                <Heading level="h2">
                  {t("attributes.selectCategory.title")}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("attributes.selectCategory.description")}
                </Text>
              </div>
              <div className="px-6 py-4">
                <Combobox
                  options={categoryOptions}
                  value={selectedCategoryIds}
                  onChange={(val) => setSelectedCategoryIds(val as string[])}
                />
              </div>
              <div className="flex items-center justify-end gap-x-2 p-6">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setCategoryModalOpen(false)
                    setSelectedCategoryIds([])
                  }}
                >
                  {t("actions.cancel")}
                </Button>
                <Button
                  size="small"
                  disabled={!selectedCategoryIds.length}
                  onClick={() => handleSaveCategory()}
                >
                  {t("actions.save")}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

// --- Delete Actions ---

const AttributeActions = ({
  attribute,
}: {
  attribute: Record<string, any>
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteAttribute(attribute.id)
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

const columnHelper = createColumnHelper<any>()

export const useAttributeTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => t("attributes.fields.productAttribute"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("handle", {
        header: () => t("attributes.fields.handle"),
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
      columnHelper.accessor("is_filterable", {
        header: () => t("attributes.fields.filterable"),
        cell: ({ row }) => <FilterableToggle attribute={row.original} />,
      }),
      columnHelper.display({
        id: "is_global",
        header: () => t("attributes.fields.global"),
        cell: ({ row }) => <GlobalToggle attribute={row.original} />,
      }),
      columnHelper.display({
        id: "values",
        header: () => t("attributes.fields.values"),
        cell: ({ row }) => {
          const values = row.original.possible_values ?? []
          if (!values.length) {
            return <span className="text-ui-fg-muted">-</span>
          }
          const visible = values.slice(0, MAX_VISIBLE_VALUES)
          const remaining = values.length - MAX_VISIBLE_VALUES
          return (
            <div className="flex items-center gap-x-1">
              {visible.map((v: any) => (
                <Badge key={v.id} size="2xsmall" color="grey">
                  {v.value}
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
        cell: ({ row }) => <AttributeActions attribute={row.original} />,
      }),
    ],
    [t]
  )
}
