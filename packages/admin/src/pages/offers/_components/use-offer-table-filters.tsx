import { useTranslation } from "react-i18next"
import { ProductStatus } from "@mercurjs/types"

import { Filter } from "../../../components/table/data-table"
import { useSellers } from "../../../hooks/api/sellers"
import {
  useCollections,
  useProductCategories,
  useProductTags,
} from "../../../hooks/api"
import { useProductTypes } from "../../../hooks/api/product-types"

/**
 * Filters for the product-backed admin Offers list (SPEC-010): the
 * admin-only **Store** filter (carried over from SPEC-004) plus the
 * product-graph filters that match the B2C design — Category / Collection
 * / Type / Tag / Status / Created / Updated. The shipped SKU +
 * shipping-profile filters are dropped (those concerns live on the Offer
 * Variant detail now).
 */
export const useOfferTableFilters = (): Filter[] => {
  const { t } = useTranslation()
  const { sellers } = useSellers({ limit: 1000 })
  const { product_categories } = useProductCategories({
    limit: 1000,
    fields: "id,name",
  })
  const { collections } = useCollections({ limit: 1000 })
  const { product_types } = useProductTypes({ limit: 1000 })
  const { product_tags } = useProductTags({ limit: 1000 })

  const filters: Filter[] = []

  if (sellers && sellers.length > 0) {
    filters.push({
      type: "select",
      key: "seller_id",
      label: t("offers.fields.store"),
      multiple: true,
      searchable: true,
      options: sellers.map((s: { id: string; name?: string | null }) => ({
        label: s.name ?? s.id,
        value: s.id,
      })),
    })
  }

  if (product_categories && product_categories.length > 0) {
    filters.push({
      type: "select",
      key: "category_id",
      label: t("fields.category"),
      multiple: true,
      searchable: true,
      options: product_categories.map(
        (c: { id: string; name?: string | null }) => ({
          label: c.name ?? c.id,
          value: c.id,
        }),
      ),
    })
  }

  if (collections && collections.length > 0) {
    filters.push({
      type: "select",
      key: "collection_id",
      label: t("fields.collection"),
      multiple: true,
      searchable: true,
      options: collections.map(
        (c: { id: string; title?: string | null }) => ({
          label: c.title ?? c.id,
          value: c.id,
        }),
      ),
    })
  }

  if (product_types && product_types.length > 0) {
    filters.push({
      type: "select",
      key: "type_id",
      label: t("fields.type"),
      multiple: true,
      searchable: true,
      options: product_types.map(
        (pt: { id: string; value?: string | null }) => ({
          label: pt.value ?? pt.id,
          value: pt.id,
        }),
      ),
    })
  }

  if (product_tags && product_tags.length > 0) {
    filters.push({
      type: "select",
      key: "tag_id",
      label: t("fields.tag"),
      multiple: true,
      searchable: true,
      options: product_tags.map(
        (pt: { id: string; value?: string | null }) => ({
          label: pt.value ?? pt.id,
          value: pt.id,
        }),
      ),
    })
  }

  filters.push({
    type: "select",
    key: "status",
    label: t("fields.status"),
    multiple: true,
    options: [
      { label: t("products.productStatus.draft"), value: ProductStatus.DRAFT },
      {
        label: t("products.productStatus.proposed"),
        value: ProductStatus.PROPOSED,
      },
      {
        label: t("products.productStatus.published"),
        value: ProductStatus.PUBLISHED,
      },
      {
        label: t("products.productStatus.rejected"),
        value: ProductStatus.REJECTED,
      },
    ],
  })

  filters.push({
    type: "date",
    key: "created_at",
    label: t("fields.createdAt"),
  })

  filters.push({
    type: "date",
    key: "updated_at",
    label: t("fields.updatedAt"),
  })

  return filters
}
