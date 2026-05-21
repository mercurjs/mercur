import { Checkbox, Input, StatusBadge, Text } from "@medusajs/ui"
import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../../components/common/thumbnail"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { useVariants } from "../../../../hooks/api/product-variants"
import {
  CreateOfferFormValues,
  VariantSnapshot,
} from "./schema"

const PAGE_SIZE = 10

type VariantRow = {
  id: string
  title?: string | null
  sku?: string | null
  product_id?: string | null
  product?: {
    id?: string | null
    title?: string | null
    thumbnail?: string | null
    status?: string | null
    categories?: { id?: string | null; name?: string | null }[] | null
    collection?: { id?: string | null; title?: string | null } | null
  } | null
}

const Root = () => {
  const { t } = useTranslation()
  const form = useFormContext<CreateOfferFormValues>()
  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)

  const offset = page * PAGE_SIZE

  const {
    variants,
    count = 0,
    isPending,
    isError,
    error,
  } = useVariants({
    q: q || undefined,
    limit: PAGE_SIZE,
    offset,
    fields:
      "id,title,sku,product_id,*product,*product.categories,*product.collection",
  }) as {
    variants?: VariantRow[]
    count?: number
    isPending: boolean
    isError: boolean
    error?: Error
  }

  if (isError) throw error

  const selectedIds = form.watch("selected_variant_ids") ?? []
  const selectedVariants = form.watch("selected_variants") ?? []

  const toggleVariant = (variant: VariantRow, checked: boolean) => {
    if (!variant.id) return
    const id = variant.id
    const nextIds = checked
      ? Array.from(new Set([...selectedIds, id]))
      : selectedIds.filter((x) => x !== id)

    let nextSnapshots: VariantSnapshot[]
    if (checked) {
      const snapshot: VariantSnapshot = {
        variant_id: id,
        variant_title: variant.title ?? id,
        product_id: variant.product_id ?? variant.product?.id ?? "",
        product_title: variant.product?.title ?? "",
        product_thumbnail: variant.product?.thumbnail ?? null,
        variant_sku: variant.sku ?? null,
      }
      const filtered = selectedVariants.filter((v) => v.variant_id !== id)
      nextSnapshots = [...filtered, snapshot]
    } else {
      nextSnapshots = selectedVariants.filter((v) => v.variant_id !== id)
    }

    form.setValue("selected_variant_ids", nextIds, { shouldValidate: true, shouldDirty: true })
    form.setValue("selected_variants", nextSnapshots, { shouldValidate: true, shouldDirty: true })
  }

  const pageVariants = variants ?? []
  const allPageSelected =
    pageVariants.length > 0 && pageVariants.every((v) => v.id && selectedIds.includes(v.id))
  const somePageSelected =
    pageVariants.some((v) => v.id && selectedIds.includes(v.id)) && !allPageSelected

  const toggleAllOnPage = (checked: boolean) => {
    for (const v of pageVariants) {
      const isSelected = v.id ? selectedIds.includes(v.id) : false
      if (checked && !isSelected) toggleVariant(v, true)
      if (!checked && isSelected) toggleVariant(v, false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="flex flex-col p-6 gap-y-3" data-testid="offer-create-tab-catalogue">
      <div className="flex items-center justify-between gap-x-2">
        <Text size="small" weight="plus">
          {t("offers.create.tabs.catalogue")}
        </Text>
        <div className="flex items-center gap-x-2">
          <div className="w-64">
            <Input
              type="search"
              placeholder={t("general.search")}
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(0)
              }}
              data-testid="offer-create-catalogue-search"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-ui-bg-subtle text-ui-fg-subtle border-b">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={
                    allPageSelected
                      ? true
                      : somePageSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(v) => toggleAllOnPage(!!v)}
                />
              </th>
              <th className="px-4 py-3 font-medium">{t("fields.product")}</th>
              <th className="px-4 py-3 font-medium">
                {t("offers.fields.category")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("offers.fields.collection")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("offers.fields.variants")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("offers.fields.status")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isPending && pageVariants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("labels.loading")}
                  </Text>
                </td>
              </tr>
            )}
            {!isPending && pageVariants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("general.noResultsTitle")}
                  </Text>
                </td>
              </tr>
            )}
            {pageVariants.map((variant) => {
              const id = variant.id
              const isSelected = id ? selectedIds.includes(id) : false
              const status = variant.product?.status
              return (
                <tr
                  key={id}
                  className="hover:bg-ui-bg-subtle-hover"
                  data-testid={`offer-create-catalogue-row-${id}`}
                >
                  <td className="px-4 py-3 align-top">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => toggleVariant(variant, !!v)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-x-3">
                      <Thumbnail src={variant.product?.thumbnail ?? null} />
                      <div className="flex flex-col">
                        <Text size="small" weight="plus" leading="compact">
                          {variant.product?.title ?? variant.title}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {variant.title}
                        </Text>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Text size="small" className="text-ui-fg-subtle">
                      {variant.product?.categories?.[0]?.name ?? "-"}
                    </Text>
                  </td>
                  <td className="px-4 py-3">
                    <Text size="small" className="text-ui-fg-subtle">
                      {variant.product?.collection?.title ?? "-"}
                    </Text>
                  </td>
                  <td className="px-4 py-3">
                    <Text size="small" className="text-ui-fg-subtle">
                      {variant.title ?? "-"}
                    </Text>
                  </td>
                  <td className="px-4 py-3">
                    {status === "published" ? (
                      <StatusBadge color="green">
                        {t("offers.status.published")}
                      </StatusBadge>
                    ) : (
                      <StatusBadge color="grey">
                        {t(`offers.status.${status ?? "draft"}`, {
                          defaultValue: status ?? "-",
                        })}
                      </StatusBadge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Text size="small" className="text-ui-fg-subtle">
            {Math.min(offset + 1, count)} — {Math.min(offset + PAGE_SIZE, count)}{" "}
            {t("general.of")} {count} {t("general.results")}
          </Text>
          <div className="flex items-center gap-x-3">
            <Text size="small" className="text-ui-fg-subtle">
              {page + 1} {t("general.of")} {totalPages} {t("general.pages")}
            </Text>
            <button
              type="button"
              className="text-ui-fg-interactive disabled:text-ui-fg-disabled"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              {t("general.prev")}
            </button>
            <button
              type="button"
              className="text-ui-fg-interactive disabled:text-ui-fg-disabled"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("general.next")}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-ui-bg-subtle text-ui-fg-subtle rounded-md p-4">
        <Text size="small">{t("offers.create.tip")}</Text>
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "catalogue",
  labelKey: "offers.create.tabs.catalogue",
  validationFields: ["selected_variant_ids"],
})

export const CreateOfferCatalogueTab = Root
