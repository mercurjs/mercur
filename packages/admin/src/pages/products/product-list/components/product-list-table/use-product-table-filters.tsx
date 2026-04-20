import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { createDataTableFilterHelper } from "@medusajs/ui"
import { ProductDTO } from "@mercurjs/types"
import { useDataTableDateFilters } from "../../../../../components/data-table/helpers/general/use-data-table-date-filters"
import { useProductTypes } from "../../../../../hooks/api/product-types"
import { useProductTags, useProductCategories, useCollections } from "../../../../../hooks/api"

const filterHelper = createDataTableFilterHelper<ProductDTO>()

/**
 * Hook to create filters in the format expected by @medusajs/ui DataTable
 */
export const useProductTableFilters = () => {
  const { t } = useTranslation()
  const dateFilters = useDataTableDateFilters()

  const { product_types } = useProductTypes({
    limit: 1000,
    offset: 0,
  })

  const { product_tags } = useProductTags({
    limit: 1000,
    offset: 0,
  })

  const { product_categories } = useProductCategories({
    limit: 1000,
    offset: 0,
    fields: "id,name",
  })

  const { collections } = useCollections({
    limit: 1000,
    offset: 0,
  })

  return useMemo(() => {
    const filters = [...dateFilters]

    if (product_categories?.length) {
      filters.push(
        filterHelper.accessor("category_id", {
          label: t("fields.category"),
          type: "multiselect",
          options: product_categories.map((c) => ({
            label: c.name,
            value: c.id,
          })),
        })
      )
    }

    if (collections?.length) {
      filters.push(
        filterHelper.accessor("collection_id", {
          label: t("fields.collection"),
          type: "multiselect",
          options: collections.map((c) => ({
            label: c.title,
            value: c.id,
          })),
        })
      )
    }

    if (product_types?.length) {
      filters.push(
        filterHelper.accessor("type_id", {
          label: t("fields.type"),
          type: "multiselect",
          options: product_types.map((t) => ({
            label: t.value,
            value: t.id,
          })),
        })
      )
    }

    if (product_tags?.length) {
      filters.push(
        filterHelper.accessor("tag_id", {
          label: t("fields.tag"),
          type: "multiselect",
          options: product_tags.map((t) => ({
            label: t.value,
            value: t.id,
          })),
        })
      )
    }

    // Status filter
    filters.push(
      filterHelper.accessor("status", {
        label: t("fields.status"),
        type: "multiselect",
        options: [
          {
            label: t("products.productStatus.pending"),
            value: "pending",
          },
          {
            label: t("products.productStatus.accepted"),
            value: "accepted",
          },
          {
            label: t("products.productStatus.changes_required"),
            value: "changes_required",
          },
          {
            label: t("products.productStatus.rejected"),
            value: "rejected",
          },
        ],
      })
    )

    return filters
  }, [product_types, product_tags, product_categories, collections, dateFilters, t])
}