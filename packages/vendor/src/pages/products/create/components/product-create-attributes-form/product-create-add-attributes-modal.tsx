import { ProductAttributeDTO } from "@mercurjs/types"
import { Badge, Button, Checkbox } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  createColumnHelper,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { StackedFocusModal, useStackedModal } from "@components/modals"
import { _DataTable } from "@components/table/data-table"
import { useTabbedForm } from "@components/tabbed-form/tabbed-form"
import { useProductAttributes } from "@hooks/api"
import { useAttributeTableFilters } from "@hooks/table/filters/use-attribute-table-filters"
import { useAttributeTableQuery } from "@hooks/table/query/use-attribute-table-query"
import { useDataTable } from "@hooks/use-data-table"

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

type SelectedAttribute = {
  id: string
  name: string
  values: string[]
  is_variant_axis: boolean
  type: string
  available_values: { id: string; name: string }[]
}

export const ProductCreateAddAttributesModal = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { t } = useTranslation()
  const { getValues, setValue } = form
  const { setIsOpen, getIsOpen } = useStackedModal()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [selected, setSelected] = useState<SelectedAttribute[]>([])

  const categoryId = form.watch("category_id")

  const { searchParams, raw } = useAttributeTableQuery({
    pageSize: PAGE_SIZE,
    prefix: ADD_ATTRIBUTES_MODAL_ID,
  })
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

    const selection: RowSelectionState = {}
    const entries: SelectedAttribute[] = []

    for (const a of existing) {
      if (a.attribute_id) {
        selection[a.attribute_id] = true
        const apiAttr = product_attributes?.find(
          (pa: ProductAttributeDTO) => pa.id === a.attribute_id
        )
        entries.push({
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
            apiAttr?.values?.map((v: { id: string; name: string }) => ({
              id: v.id,
              name: v.name,
            })) ??
            [],
        })
      }
    }

    if (product_attributes) {
      for (const attr of product_attributes as ProductAttributeDTO[]) {
        if (attr.is_required && !selection[attr.id]) {
          selection[attr.id] = true
          entries.push({
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
    setSelected(entries)
  }, [open, getValues, product_attributes])

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const next = typeof fn === "function" ? fn(rowSelection) : fn

    // Required attributes can never be deselected.
    if (product_attributes) {
      for (const attr of product_attributes as ProductAttributeDTO[]) {
        if (attr.is_required) {
          next[attr.id] = true
        }
      }
    }

    const addedIds = new Set(
      Object.keys(next).filter((id) => next[id] && !rowSelection[id])
    )

    const addedAttributes: SelectedAttribute[] =
      addedIds.size > 0
        ? (product_attributes
            ?.filter((attr: ProductAttributeDTO) => addedIds.has(attr.id))
            .map((attr: ProductAttributeDTO) => ({
              id: attr.id,
              name: attr.name,
              values: [],
              is_variant_axis: attr.is_variant_axis,
              type: attr.type,
              available_values:
                attr.values?.map((v) => ({ id: v.id, name: v.name })) ?? [],
            })) ?? [])
        : []

    setSelected((prev) => {
      const kept = prev.filter((a) => next[a.id])
      return Array.from(new Set([...kept, ...addedAttributes]))
    })
    setRowSelection(next)
  }

  const handleAdd = () => {
    const currentAttributes = getValues("attributes") ?? []
    const customAttributes = currentAttributes.filter((a) => a.is_custom)

    const requiredIds = new Set(
      product_attributes
        ?.filter((a: ProductAttributeDTO) => a.is_required)
        .map((a: ProductAttributeDTO) => a.id) ?? []
    )

    const selectedAttributes = selected.map((a) => ({
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

  const filters = useAttributeTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: product_attributes ?? [],
    columns,
    count,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enablePagination: true,
    enableRowSelection: (row) => !row.original.is_required,
    rowSelection: { state: rowSelection, updater },
    prefix: ADD_ATTRIBUTES_MODAL_ID,
  })

  if (isError) {
    throw error
  }

  return (
    <StackedFocusModal.Content className="flex flex-col overflow-hidden">
      <StackedFocusModal.Header />
      <StackedFocusModal.Body className="flex size-full flex-col overflow-hidden">
        <_DataTable
          table={table}
          columns={columns}
          count={count}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          filters={filters}
          orderBy={[
            { key: "name", label: t("attributes.fields.name") },
            { key: "created_at", label: t("fields.createdAt") },
            { key: "updated_at", label: t("fields.updatedAt") },
          ]}
          queryObject={raw}
          prefix={ADD_ATTRIBUTES_MODAL_ID}
          layout="fill"
          pagination
          search
          noRecords={{
            title: t("products.create.attributes.noAttributesTitle"),
            message: t("products.create.attributes.noAttributesDescription"),
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

const columnHelper = createColumnHelper<ProductAttributeDTO>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      }),
      columnHelper.accessor("name", {
        header: t("attributes.fields.productAttribute"),
      }),
      columnHelper.accessor("handle", {
        header: t("attributes.fields.handle"),
        cell: (info) => {
          const handle = info.getValue()
          return handle ? `/${handle}` : "-"
        },
      }),
      columnHelper.accessor("is_required", {
        header: t("attributes.fields.required"),
        cell: (info) =>
          info.getValue() ? t("filters.radio.yes") : t("filters.radio.no"),
      }),
      columnHelper.accessor("type", {
        header: t("attributes.fields.type"),
        cell: (info) => {
          const type = info.getValue()
          const labelKey = ATTRIBUTE_TYPE_LABELS[type]
          return labelKey ? t(labelKey) : type
        },
      }),
      columnHelper.accessor("is_variant_axis", {
        header: t("attributes.fields.variantAxis"),
        cell: (info) =>
          info.getValue() ? t("filters.radio.yes") : t("filters.radio.no"),
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
