import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { HttpTypes } from "@medusajs/types"
import { Checkbox, Tooltip } from "@medusajs/ui"
import { ColumnDef } from "@tanstack/react-table"
import { UseFormReturn, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  createDataGridHelper,
  createDataGridPriceColumns,
  DataGrid,
} from "@components/data-grid"
import { DataGridMediaCell } from "../../../../components/data-grid/components/data-grid-media-cell"
import { useAttributes } from "../../../../hooks/api/attributes"
import { useStockLocations } from "@hooks/api/stock-locations"
import { ProductCreateVariantSchema } from "../constants"
import { ProductCreateSchemaType } from "../types"
import { decorateVariantsWithDefaultValues } from "../utils"

type MediaItem = {
  file?: File
  url?: string
  isThumbnail?: boolean
  id?: string
}

type ProductCreateVariantsFormProps = {
  form: UseFormReturn<ProductCreateSchemaType>
  store?: HttpTypes.AdminStore
  regions?: HttpTypes.AdminRegion[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
  onOpenMediaModal?: (
    variantIndex: number,
    variantTitle?: string,
    initialMedia?: MediaItem[],
    productMedia?: MediaItem[]
  ) => void
  productMedia?: MediaItem[]
}

type VariantWithIndex = ProductCreateVariantSchema & {
  originalIndex: number
}

export const ProductCreateVariantsForm = ({
  form,
  store,
  regions = [],
  pricePreferences = [],
  onOpenMediaModal,
  productMedia = [],
}: ProductCreateVariantsFormProps) => {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState("")

  const variants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  })

  const attributesResult = useAttributes()
  const allAttributes = (attributesResult as any).attributes || []

  const { stock_locations = [] } = useStockLocations({
    limit: 9999,
    fields: "id,name",
  })

  const formValues = useWatch({
    control: form.control,
  })

  const variantAttributes = useMemo(() => {
    const result: Array<{
      handle: string
      name: string
      selectedValues: Array<{ id: string; value: string }>
    }> = []

    allAttributes.forEach((attr: any) => {
      if (attr.ui_component === "multivalue") {
        const useForVariants = (formValues as any)?.[
          `${attr.handle}UseForVariants`
        ]
        if (useForVariants === false) return

        const selectedValueIds = (formValues as any)?.[attr.handle]

        if (
          selectedValueIds &&
          Array.isArray(selectedValueIds) &&
          selectedValueIds.length > 0
        ) {
          const selectedValues = selectedValueIds
            .map((valueId: string) => {
              const possibleValue = attr.possible_values?.find(
                (pv: any) => pv.id === valueId
              )
              return possibleValue
                ? { id: valueId, value: possibleValue.value }
                : null
            })
            .filter(
              (item: any): item is { id: string; value: string } =>
                item !== null
            )

          if (selectedValues.length > 0) {
            result.push({
              handle: attr.handle,
              name: attr.name,
              selectedValues,
            })
          }
        }
      }
    })

    const options = (formValues as any)?.options || []
    options.forEach((option: any) => {
      if (
        option?.useForVariants !== false &&
        option?.title &&
        option?.values &&
        Array.isArray(option.values) &&
        option.values.length > 0
      ) {
        result.push({
          handle: `option-${option.title}`,
          name: option.title,
          selectedValues: option.values.map((value: string) => ({
            id: value,
            value,
          })),
        })
      }
    })

    return result
  }, [allAttributes, formValues])

  const hasProductMedia = productMedia.length > 0

  const columns = useColumns({
    variantAttributes,
    store,
    regions,
    pricePreferences,
    stockLocations: stock_locations,
    onOpenMediaModal,
    form,
    productMedia,
    hasProductMedia,
  })

  const variantData = useMemo(() => {
    const ret: VariantWithIndex[] = []

    if (variantAttributes.length > 0) {
      const totalCombinations = variantAttributes.reduce(
        (acc, attr) => acc * attr.selectedValues.length,
        1
      )

      for (let i = 0; i < totalCombinations; i++) {
        const variantOptions: Record<string, string> = {}
        variantAttributes.forEach((attr) => {
          let valueIndex = 0
          let divisor = 1

          for (let j = variantAttributes.length - 1; j >= 0; j--) {
            if (variantAttributes[j].handle === attr.handle) {
              valueIndex =
                Math.floor(i / divisor) %
                attr.selectedValues.length
              break
            }
            divisor *= variantAttributes[j].selectedValues.length
          }

          variantOptions[attr.name] =
            attr.selectedValues[valueIndex]?.value || ""
        })

        const autoTitle = variantAttributes
          .map((attr) => variantOptions[attr.name])
          .filter(Boolean)
          .join(" / ")

        const existingVariant = variants.find((v) => {
          if (!v.options) return false
          return variantAttributes.every(
            (attr) => v.options[attr.name] === variantOptions[attr.name]
          )
        })

        ret.push({
          title: autoTitle,
          should_create: existingVariant?.should_create ?? true,
          variant_rank: i,
          options: variantOptions,
          sku: existingVariant?.sku || "",
          prices: existingVariant?.prices || {},
          is_default: i === 0,
          media: existingVariant?.media || [],
          originalIndex: existingVariant
            ? variants.indexOf(existingVariant)
            : i,
        } as VariantWithIndex)
      }
    } else {
      variants.forEach((v, i) => {
        if (v.should_create) {
          ret.push({
            ...v,
            originalIndex: i,
          } as VariantWithIndex)
        }
      })
    }

    return ret
  }, [variants, variantAttributes])

  const filteredVariantData = useMemo(() => {
    if (!searchValue.trim()) return variantData

    return variantData.filter((variant) =>
      variant.title.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [variantData, searchValue])

  const variantStructureKey = useMemo(() => {
    return variantAttributes
      .map(
        (attr) =>
          `${attr.handle}:${attr.selectedValues.map((v) => v.id).join(",")}`
      )
      .join("|")
  }, [variantAttributes])

  useEffect(() => {
    if (variantAttributes.length > 0) {
      const totalCombinations = variantAttributes.reduce(
        (acc, attr) => acc * attr.selectedValues.length,
        1
      )
      const currentVariants = form.getValues("variants") || []
      const newVariants: any[] = []

      for (let i = 0; i < totalCombinations; i++) {
        const variantOptions: Record<string, string> = {}
        variantAttributes.forEach((attr) => {
          let valueIndex = 0
          let divisor = 1

          for (let j = variantAttributes.length - 1; j >= 0; j--) {
            if (variantAttributes[j].handle === attr.handle) {
              valueIndex =
                Math.floor(i / divisor) %
                attr.selectedValues.length
              break
            }
            divisor *= variantAttributes[j].selectedValues.length
          }

          variantOptions[attr.name] =
            attr.selectedValues[valueIndex]?.value || ""
        })

        const autoTitle = variantAttributes
          .map((attr) => variantOptions[attr.name])
          .filter(Boolean)
          .join(" / ")

        const existingVariant = currentVariants.find((v) => {
          if (!v.options) return false
          return variantAttributes.every(
            (attr) => v.options[attr.name] === variantOptions[attr.name]
          )
        })

        newVariants.push({
          title: autoTitle,
          should_create: existingVariant?.should_create ?? true,
          variant_rank: i,
          options: variantOptions,
          sku: existingVariant?.sku || "",
          prices: existingVariant?.prices || {},
          is_default: i === 0,
          media: existingVariant?.media || [],
        })
      }

      form.setValue("variants", newVariants)
    } else {
      const currentVariants = form.getValues("variants") || []

      if (currentVariants.length === 0) {
        const defaultVariant = decorateVariantsWithDefaultValues([
          {
            title: "Default variant",
            should_create: true,
            variant_rank: 0,
            options: {},
            sku: "",
            prices: {},
            is_default: true,
            media: [],
          },
        ])

        form.setValue("variants", defaultVariant)
      } else {
        const hasOnlyDefaultVariant =
          currentVariants.length === 1 && currentVariants[0].is_default
        if (!hasOnlyDefaultVariant) {
          const defaultVariant = decorateVariantsWithDefaultValues([
            {
              title: "Default variant",
              should_create: true,
              variant_rank: 0,
              options: {},
              sku: "",
              prices: {},
              is_default: true,
              media: [],
            },
          ])

          form.setValue("variants", defaultVariant)
        }
      }
    }
  }, [variantStructureKey, form])

  return (
    <div className="border-ui-border flex h-full flex-col justify-between divide-y">
      <DataGrid
        columns={columns}
        data={filteredVariantData}
        state={form}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={t(
          "products.create.variants.productVariants.searchPlaceholder"
        )}
      />
    </div>
  )
}

const columnHelper = createDataGridHelper<
  VariantWithIndex,
  ProductCreateSchemaType
>()

const useColumns = ({
  variantAttributes = [],
  store,
  regions = [],
  pricePreferences = [],
  stockLocations = [],
  onOpenMediaModal,
  form,
  productMedia = [],
  hasProductMedia = false,
}: {
  variantAttributes?: Array<{
    handle: string
    name: string
    selectedValues: Array<{ id: string; value: string }>
  }>
  store?: HttpTypes.AdminStore
  regions?: HttpTypes.AdminRegion[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
  stockLocations?: HttpTypes.AdminStockLocation[]
  onOpenMediaModal?: (
    variantIndex: number,
    variantTitle?: string,
    initialMedia?: MediaItem[],
    productMedia?: MediaItem[]
  ) => void
  form: UseFormReturn<ProductCreateSchemaType>
  productMedia?: MediaItem[]
  hasProductMedia?: boolean
}) => {
  const { t } = useTranslation()

  const variants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  })

  const variantsRef = useRef(variants)
  variantsRef.current = variants

  const allSelected =
    variants.length > 0 && variants.every((v) => v.should_create)
  const someSelected =
    variants.some((v) => v.should_create) && !allSelected

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const currentVariants = form.getValues("variants") || []
      const updatedVariants = currentVariants.map((v) => ({
        ...v,
        should_create: checked,
      }))
      form.setValue("variants", updatedVariants)
    },
    [form]
  )

  return useMemo(
    () =>
      [
        columnHelper.column({
          id: "checkbox",
          header: () => (
            <Checkbox
              checked={
                allSelected
                  ? true
                  : someSelected
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={handleSelectAll}
            />
          ),
          field: (context) => {
            const rowData = context.row
              .original as VariantWithIndex
            return `variants.${rowData.originalIndex}.should_create`
          },
          type: "boolean",
          cell: (context) => (
            <DataGrid.BooleanCell context={context} />
          ),
          disableHiding: true,
          size: 52,
          pin: "left",
        }),
        columnHelper.column({
          id: "options_combined",
          name:
            variantAttributes.length > 0
              ? variantAttributes
                  .map((attr) => attr.name)
                  .join(" / ")
              : "Options",
          header: () => {
            const label =
              variantAttributes.length > 0
                ? variantAttributes
                    .map((attr) => attr.name)
                    .join(" / ")
                : "Options"

            return (
              <Tooltip content={label}>
                <span className="w-full truncate">{label}</span>
              </Tooltip>
            )
          },
          cell: (context) => {
            if (variantAttributes.length === 0) {
              return (
                <DataGrid.ReadonlyCell context={context} />
              )
            }
            const rowData = context.row
              .original as VariantWithIndex
            const combinedValue = variantAttributes
              .map(
                (attr) => rowData.options?.[attr.name] || ""
              )
              .filter(Boolean)
              .join(" / ")

            return (
              <DataGrid.ReadonlyCell context={context}>
                {combinedValue}
              </DataGrid.ReadonlyCell>
            )
          },
          disableHiding: true,
          pin: "left",
        }),
        columnHelper.column({
          id: "title",
          name: t("fields.title"),
          header: t("fields.title"),
          field: (context) => {
            const rowData = context.row
              .original as VariantWithIndex
            return `variants.${rowData.originalIndex}.title`
          },
          type: "text",
          cell: (context) => (
            <DataGrid.TextCell context={context} />
          ),
          disableHiding: true,
          pin: "left",
        }),
        columnHelper.column({
          id: "media",
          name: t(
            "products.create.variants.productVariants.media"
          ),
          header: t(
            "products.create.variants.productVariants.media"
          ),
          field: (context) => {
            const rowData = context.row
              .original as VariantWithIndex
            return `variants.${rowData.originalIndex}.media`
          },
          type: "media" as any,
          cell: (context) => {
            const rowData = context.row
              .original as VariantWithIndex

            return (
              <DataGridMediaCell
                context={context}
                disabled={!hasProductMedia}
                onOpenMediaModal={
                  hasProductMedia
                    ? () => {
                        const currentMedia =
                          variantsRef.current[
                            rowData.originalIndex
                          ]?.media
                        onOpenMediaModal?.(
                          rowData.originalIndex,
                          rowData.title,
                          currentMedia,
                          productMedia
                        )
                      }
                    : undefined
                }
              />
            )
          },
        }),
        columnHelper.column({
          id: "sku",
          name: t("fields.sku"),
          header: t("fields.sku"),
          field: (context) => {
            const rowData = context.row
              .original as VariantWithIndex
            return `variants.${rowData.originalIndex}.sku`
          },
          type: "text",
          cell: (context) => (
            <DataGrid.TextCell context={context} />
          ),
        }),
        ...createDataGridPriceColumns<
          VariantWithIndex,
          ProductCreateSchemaType
        >({
          currencies:
            store?.supported_currencies?.map(
              (c) => c.currency_code
            ) || [],
          pricePreferences,
          getFieldName: (context, value) => {
            const rowData = context.row
              .original as VariantWithIndex
            return `variants.${rowData.originalIndex}.prices.${value}`
          },
          t,
        }),
      ] as ColumnDef<VariantWithIndex>[],
    [
      variantAttributes,
      t,
      store,
      regions,
      pricePreferences,
      stockLocations,
      onOpenMediaModal,
      allSelected,
      someSelected,
      handleSelectAll,
      hasProductMedia,
      productMedia,
    ]
  )
}
