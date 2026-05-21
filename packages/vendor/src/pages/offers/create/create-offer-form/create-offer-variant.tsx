import { Container, Text, clx } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"
import { Combobox } from "../../../../components/inputs/combobox"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { useProducts } from "../../../../hooks/api/products"
import { CreateOfferFormValues } from "./schema"

type VariantOption = {
  value: string
  label: string
  productTitle: string
  variantTitle: string
  ean?: string | null
  upc?: string | null
  sku?: string | null
}

const Root = () => {
  const { t } = useTranslation()
  const form = useFormContext<CreateOfferFormValues>()
  const [search, setSearch] = useState("")

  const {
    products,
    isPending,
    isError,
    error,
  } = useProducts({ limit: 50, q: search, fields: "id,title,variants.*" })

  if (isError) throw error

  const options: VariantOption[] = useMemo(() => {
    const out: VariantOption[] = []
    for (const product of products ?? []) {
      for (const variant of product.variants ?? []) {
        if (!variant?.id) continue
        out.push({
          value: variant.id,
          label: `${product.title ?? ""} — ${variant.title ?? variant.id}`,
          productTitle: product.title ?? "",
          variantTitle: variant.title ?? variant.id,
          ean: (variant as { ean?: string | null }).ean,
          upc: (variant as { upc?: string | null }).upc,
          sku: variant.sku,
        })
      }
    }
    return out
  }, [products])

  const selectedId = form.watch("variant_id")
  const selected = options.find((o) => o.value === selectedId)

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="offer-create-tab-variant"
    >
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <Form.Field
          control={form.control}
          name="variant_id"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t("offers.fields.variant")}</Form.Label>
              <Form.Control>
                <Combobox
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value ?? "")}
                  searchValue={search}
                  onSearchValueChange={setSearch}
                  options={options}
                  placeholder={t("offers.create.variantPlaceholder")}
                  hideCreateOption
                  allowClear
                  data-testid="offer-create-variant-combobox"
                />
              </Form.Control>
              <Form.Hint>{t("offers.create.variantHint")}</Form.Hint>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        {isPending && !options.length && (
          <Text size="small" className="text-ui-fg-subtle">
            {t("general.loading")}
          </Text>
        )}

        {selected && (
          <Container
            className={clx("flex flex-col gap-y-2 p-4")}
            data-testid="offer-create-variant-snapshot"
          >
            <Text size="small" weight="plus">
              {t("offers.create.selectedVariant")}
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <Text size="small" className="text-ui-fg-subtle">
                {selected.productTitle}
              </Text>
              <Text size="small">{selected.variantTitle}</Text>
              <Text size="small" className="text-ui-fg-subtle">
                {t("offers.fields.sku")}
              </Text>
              <Text size="small">{selected.sku ?? "—"}</Text>
              <Text size="small" className="text-ui-fg-subtle">
                {t("offers.fields.ean")}
              </Text>
              <Text size="small">{selected.ean ?? "—"}</Text>
              <Text size="small" className="text-ui-fg-subtle">
                {t("offers.fields.upc")}
              </Text>
              <Text size="small">{selected.upc ?? "—"}</Text>
            </div>
          </Container>
        )}
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "variant",
  labelKey: "offers.create.tabs.variant",
  validationFields: ["variant_id"],
})

export const CreateOfferVariantTab = Root
