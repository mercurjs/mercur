import { ProductAttributeDTO } from "@mercurjs/types"
import {
  Badge,
  Button,
  clx,
  createDataTableColumnHelper,
  DataTableFilter,
  DataTableRowSelectionState,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { keepPreviousData } from "@tanstack/react-query"

import { DataTable } from "../../../../../components/data-table"
import {
  StackedFocusModal,
  useStackedModal,
} from "../../../../../components/modals"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { useProductAttributes } from "../../../../../hooks/api"
import { useQueryParams } from "../../../../../hooks/use-query-params"
import { ProductCreateSchemaType } from "../../types"

export const ADD_ATTRIBUTES_MODAL_ID = "add-attributes"
const PAGE_SIZE = 20
const MAX_VISIBLE_VALUES = 2

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  single_select: "attributes.type.select",
  multi_select: "attributes.type.multivalue",
  unit: "attributes.type.unit",
  toggle: "attributes.type.toggle",
  text: "attributes.type.text_area",
}

const ADD_ATTRIBUTES_FILTER_IDS = [
  "is_required",
  "is_variant_axis",
  "type",
] as const

// The :last-of-type overrides must out-specify Medusa's fill-layout !important
// rule that borders every row, which otherwise doubles the header/last-row
// dividers. Sticky select/first cells carry their own background, so the
// selected-row colour is re-applied at the cell level.
const ATTRIBUTE_TABLE_ROW_STYLES = clx(
  "[&_thead_tr:last-of-type]:!border-b-0",
  "[&_tbody_tr:last-of-type]:!border-b-0",
  "[&_tbody_tr:has(button[data-state=checked])_td]:bg-ui-bg-highlight",
  "[&_tbody_tr:has(button:disabled)_td]:!bg-ui-bg-base",
  "[&_tbody_tr:has(button:disabled)]:text-ui-fg-muted"
)

export const ProductCreateAddAttributesModal = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { t } = useTranslation()
  const { getValues, setValue } = form
  const { setIsOpen, getIsOpen } = useStackedModal()

  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(
    {}
  )
  const [state, setState] = useState<
    {
      id: string
      name: string
      values: string[]
      is_variant_axis: boolean
      type: string
      available_values: { id: string; name: string }[]
    }[]
  >([])

  const categoryId = form.watch("category_id")

  const searchParams = useAddAttributesQuery()
  const attributesQuery = useMemo(
    () => ({ ...searchParams, category_id: categoryId || undefined }),
    [searchParams, categoryId]
  )
  const { product_attributes, count, isLoading, isError, error } =
    useProductAttributes(attributesQuery, {
      placeholderData: keepPreviousData,
    })

  const open = getIsOpen(ADD_ATTRIBUTES_MODAL_ID)

  useEffect(() => {
    if (!open) {
      return
    }

    const attributes = getValues("attributes") ?? []
    const existing = attributes.filter((a) => a.attribute_id)

    const selection: DataTableRowSelectionState = {}
    const stateEntries: typeof state = []

    // Add form-existing attributes
    for (const a of existing) {
      if (a.attribute_id) {
        selection[a.attribute_id] = true
        const apiAttr = product_attributes?.find((pa) => pa.id === a.attribute_id)
        stateEntries.push({
          id: a.attribute_id,
          name: a.title,
          values: Array.isArray(a.values)
            ? a.values
            : a.values
              ? [a.values]
              : [],
          is_variant_axis: a.use_for_variants,
          type: a.type ?? apiAttr?.type ?? "",
          available_values:
            a.available_values ??
            apiAttr?.values?.map((v) => ({ id: v.id, name: v.name })) ??
            [],
        })
      }
    }

    // Force-select required attributes
    if (product_attributes) {
      for (const attr of product_attributes) {
        if (attr.is_required && !selection[attr.id]) {
          selection[attr.id] = true
          stateEntries.push({
            id: attr.id,
            name: attr.name,
            values: [],
            is_variant_axis: attr.is_variant_axis,
            type: attr.type,
            available_values:
              attr.values?.map((v) => ({ id: v.id, name: v.name })) ?? [],
          })
        }
      }
    }

    setRowSelection(selection)
    setState(stateEntries)
  }, [open, getValues, product_attributes])

  const onRowSelectionChange = (next: DataTableRowSelectionState) => {
    // Enforce required attributes stay selected
    if (product_attributes) {
      for (const attr of product_attributes) {
        if (attr.is_required) {
          next[attr.id] = true
        }
      }
    }

    const ids = Object.keys(next)

    const addedIdsSet = new Set(
      ids.filter((id) => next[id] && !rowSelection[id])
    )

    let addedAttributes: typeof state = []

    if (addedIdsSet.size > 0) {
      addedAttributes =
        product_attributes
          ?.filter((attr) => addedIdsSet.has(attr.id))
          .map((attr) => ({
            id: attr.id,
            name: attr.name,
            values: [],
            is_variant_axis: attr.is_variant_axis,
            type: attr.type,
            available_values:
              attr.values?.map((v) => ({ id: v.id, name: v.name })) ?? [],
          })) ?? []
    }

    setState((prev) => {
      const filteredPrev = prev.filter((a) => next[a.id])
      return Array.from(new Set([...filteredPrev, ...addedAttributes]))
    })
    setRowSelection(next)
  }

  const handleAdd = () => {
    const currentAttributes = getValues("attributes") ?? []
    const customAttributes = currentAttributes.filter((a) => a.is_custom)

    const requiredIds = new Set(
      product_attributes
        ?.filter((a) => a.is_required)
        .map((a) => a.id) ?? []
    )

    const selectedAttributes = state.map((a) => ({
      attribute_id: a.id,
      title: a.name,
      values: a.values,
      is_custom: false,
      is_required: requiredIds.has(a.id),
      use_for_variants: a.is_variant_axis,
      type: a.type,
      available_values: a.available_values,
    }))

    setValue("attributes", [...selectedAttributes, ...customAttributes], {
      shouldDirty: true,
      shouldTouch: true,
    })
    setIsOpen(ADD_ATTRIBUTES_MODAL_ID, false)
  }

  const filters = useAddAttributesFilters()
  const columns = useColumns()

  if (isError) {
    throw error
  }

  return (
    <StackedFocusModal.Content className="flex flex-col overflow-hidden">
      <StackedFocusModal.Header />
      <StackedFocusModal.Body
        className={clx(
          "flex-1 overflow-hidden",
          ATTRIBUTE_TABLE_ROW_STYLES
        )}
      >
        <DataTable
          data={product_attributes}
          columns={columns}
          filters={filters}
          rowCount={count}
          pageSize={PAGE_SIZE}
          getRowId={(row) => row.id}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange,
            enableRowSelection: (row) => !row.original.is_required,
          }}
          isLoading={isLoading}
          layout="fill"
          prefix={ADD_ATTRIBUTES_MODAL_ID}
          emptyState={{
            empty: {
              heading: t("general.noRecordsTitle"),
              description: t("attributes.list.noRecordsMessage"),
            },
            filtered: {
              heading: t("general.noResultsTitle"),
              description: t("general.noResultsMessage"),
            },
          }}
        />
      </StackedFocusModal.Body>
      <StackedFocusModal.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <StackedFocusModal.Close asChild>
            <Button size="small" variant="secondary" type="button">
              {t("actions.cancel")}
            </Button>
          </StackedFocusModal.Close>
          <Button size="small" onClick={handleAdd} type="button">
            {t("actions.save")}
          </Button>
        </div>
      </StackedFocusModal.Footer>
    </StackedFocusModal.Content>
  )
}

const columnHelper = createDataTableColumnHelper<ProductAttributeDTO>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.select(),
      columnHelper.accessor("name", {
        header: t("attributes.fields.name"),
        enableSorting: true,
        sortLabel: t("attributes.fields.name"),
      }),
      columnHelper.accessor("handle", {
        header: t("attributes.fields.handle"),
        cell: (info) => {
          const handle = info.getValue()
          return handle ? `/${handle}` : "-"
        },
        enableSorting: true,
        sortLabel: t("attributes.fields.handle"),
      }),
      columnHelper.accessor("is_required", {
        header: t("attributes.fields.required"),
        cell: (info) =>
          info.getValue()
            ? t("filters.radio.yes")
            : t("filters.radio.no"),
        enableSorting: true,
        sortLabel: t("attributes.fields.required"),
      }),
      columnHelper.accessor("type", {
        header: t("attributes.fields.type"),
        cell: (info) => {
          const type = info.getValue()
          const labelKey = ATTRIBUTE_TYPE_LABELS[type]
          return labelKey ? t(labelKey) : type
        },
        enableSorting: true,
        sortLabel: t("attributes.fields.type"),
      }),
      columnHelper.accessor("is_variant_axis", {
        header: t("attributes.fields.variantAxis"),
        cell: (info) =>
          info.getValue()
            ? t("filters.radio.yes")
            : t("filters.radio.no"),
        enableSorting: true,
        sortLabel: t("attributes.fields.variantAxis"),
      }),
      columnHelper.display({
        id: "values",
        header: t("attributes.fields.values"),
        cell: ({ row }) => {
          const values =
            row.original.type === "toggle" ? [] : row.original.values ?? []
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
    ],
    [t]
  )
}

const parseFilterValue = (value?: string) => {
  if (value === undefined) {
    return undefined
  }
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const toBoolean = (value: unknown) => {
  if (value === undefined) {
    return undefined
  }
  return value === true || value === "true"
}

const useAddAttributesQuery = () => {
  const raw = useQueryParams(
    ["offset", "q", "order", ...ADD_ATTRIBUTES_FILTER_IDS],
    ADD_ATTRIBUTES_MODAL_ID
  )

  return useMemo(() => {
    const type = parseFilterValue(raw.type)

    return {
      limit: PAGE_SIZE,
      offset: raw.offset ? Number(raw.offset) : 0,
      q: raw.q || undefined,
      order: raw.order || undefined,
      is_required: toBoolean(parseFilterValue(raw.is_required)),
      is_variant_axis: toBoolean(parseFilterValue(raw.is_variant_axis)),
      type: type || undefined,
    }
  }, [raw])
}

const useAddAttributesFilters = (): DataTableFilter[] => {
  const { t } = useTranslation()

  return useMemo(() => {
    const yesNoOptions = [
      { label: t("filters.radio.yes"), value: "true" },
      { label: t("filters.radio.no"), value: "false" },
    ]

    return [
      {
        id: "is_required",
        type: "radio",
        label: t("attributes.fields.required"),
        options: yesNoOptions,
      },
      {
        id: "is_variant_axis",
        type: "radio",
        label: t("attributes.fields.variantAxis"),
        options: yesNoOptions,
      },
      {
        id: "type",
        type: "radio",
        label: t("attributes.fields.type"),
        options: Object.entries(ATTRIBUTE_TYPE_LABELS).map(
          ([value, labelKey]) => ({ label: t(labelKey), value })
        ),
      },
    ]
  }, [t])
}
