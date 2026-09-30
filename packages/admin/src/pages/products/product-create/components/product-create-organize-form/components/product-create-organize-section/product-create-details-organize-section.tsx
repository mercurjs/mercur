import { usePermissionGate } from "@mercurjs/dashboard-shared"
import { Heading } from "@medusajs/ui"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ConditionalTooltip } from "../../../../../../../components/common/conditional-tooltip"
import { Form } from "../../../../../../../components/common/form"
import { SwitchBox } from "../../../../../../../components/common/switch-box"
import { Combobox } from "../../../../../../../components/inputs/combobox"
import { useTabbedForm } from "../../../../../../../components/tabbed-form/tabbed-form"
import { useComboboxData } from "../../../../../../../hooks/use-combobox-data"
import { sdk } from "../../../../../../../lib/client"
import { SingleCategoryCombobox } from "../../../../../common/components/category-combobox"
import { ProductCreateSchemaType } from "../../../../types"

export const ProductCreateOrganizationSection = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { t } = useTranslation()

  const collectionsGate = usePermissionGate("product_collections:view")
  const typesGate = usePermissionGate("product_types:view")
  const tagsGate = usePermissionGate("product_tags:view")
  const sellersGate = usePermissionGate("sellers:view")

  const collections = useComboboxData({
    queryKey: ["product_collections"],
    queryFn: (params) => sdk.admin.collections.query(params),
    getOptions: (data) =>
      data.collections.map((collection) => ({
        label: collection.title!,
        value: collection.id!,
      })),
    enabled: collectionsGate.allowed,
  })

  const types = useComboboxData({
    queryKey: ["product_types"],
    queryFn: (params) => sdk.admin.productTypes.query(params),
    getOptions: (data) =>
      data.product_types.map((type) => ({
        label: type.value,
        value: type.id,
      })),
    enabled: typesGate.allowed,
  })

  const tags = useComboboxData({
    queryKey: ["product_tags"],
    queryFn: (params) => sdk.admin.productTags.query(params),
    getOptions: (data) =>
      data.product_tags.map((tag) => ({
        label: tag.value,
        value: tag.id,
      })),
    enabled: tagsGate.allowed,
  })

  const sellers = useComboboxData({
    queryKey: ["sellers"],
    queryFn: (params) => sdk.admin.sellers.query(params),
    getOptions: (data) =>
      data.sellers.map((seller: { id: string; name: string }) => ({
        label: seller.name,
        value: seller.id,
      })),
    enabled: sellersGate.allowed,
  })

  const isGloballyAvailable = useWatch({
    control: form.control,
    name: "globally_available",
  })

  return (
    <div id="organize" className="flex flex-col gap-y-8" data-testid="product-create-organize-section">
      <Heading data-testid="product-create-organize-section-heading">{t("products.organization.header")}</Heading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="product-create-organize-section-category-collection">
        <Form.Field
          control={form.control}
          name="category_id"
          render={({ field }) => {
            return (
              <Form.Item data-testid="product-create-organize-section-category-item">
                <Form.Label data-testid="product-create-organize-section-category-label">
                  {t("fields.category")}
                </Form.Label>
                <Form.Control data-testid="product-create-organize-section-category-control">
                  <SingleCategoryCombobox
                    {...field}
                    data-testid="product-create-organize-section-category-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
        <Form.Field
          control={form.control}
          name="collection_id"
          render={({ field }) => {
            return (
              <Form.Item data-testid="product-create-organize-section-collection-item">
                <Form.Label optional data-testid="product-create-organize-section-collection-label">
                  {t("products.fields.collection.label")}
                </Form.Label>
                <ConditionalTooltip
                  showTooltip={collectionsGate.denied}
                  content={collectionsGate.tooltip}
                >
                  <div>
                    <Form.Control data-testid="product-create-organize-section-collection-control">
                      <Combobox
                        {...field}
                        disabled={collectionsGate.denied}
                        options={collections.options}
                        searchValue={collections.searchValue}
                        onSearchValueChange={collections.onSearchValueChange}
                        fetchNextPage={collections.fetchNextPage}
                        data-testid="product-create-organize-section-collection-input"
                      />
                    </Form.Control>
                  </div>
                </ConditionalTooltip>
                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="product-create-organize-section-type-tags">
        <Form.Field
          control={form.control}
          name="type_id"
          render={({ field }) => {
            return (
              <Form.Item data-testid="product-create-organize-section-type-item">
                <Form.Label optional data-testid="product-create-organize-section-type-label">
                  {t("products.fields.type.label")}
                </Form.Label>
                <ConditionalTooltip
                  showTooltip={typesGate.denied}
                  content={typesGate.tooltip}
                >
                  <div>
                    <Form.Control data-testid="product-create-organize-section-type-control">
                      <Combobox
                        {...field}
                        disabled={typesGate.denied}
                        options={types.options}
                        searchValue={types.searchValue}
                        onSearchValueChange={types.onSearchValueChange}
                        fetchNextPage={types.fetchNextPage}
                        data-testid="product-create-organize-section-type-input"
                      />
                    </Form.Control>
                  </div>
                </ConditionalTooltip>
                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
        <Form.Field
          control={form.control}
          name="tags"
          render={({ field }) => {
            return (
              <Form.Item data-testid="product-create-organize-section-tags-item">
                <Form.Label optional data-testid="product-create-organize-section-tags-label">
                  {t("products.fields.tags.label")}
                </Form.Label>
                <ConditionalTooltip
                  showTooltip={tagsGate.denied}
                  content={tagsGate.tooltip}
                >
                  <div>
                    <Form.Control data-testid="product-create-organize-section-tags-control">
                      <Combobox
                        {...field}
                        disabled={tagsGate.denied}
                        options={tags.options}
                        searchValue={tags.searchValue}
                        onSearchValueChange={tags.onSearchValueChange}
                        fetchNextPage={tags.fetchNextPage}
                        data-testid="product-create-organize-section-tags-input"
                      />
                    </Form.Control>
                  </div>
                </ConditionalTooltip>
                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
      </div>
      <div className="flex flex-col gap-y-4">
        <SwitchBox
          control={form.control}
          name="discountable"
          label={t("products.fields.discountable.label")}
          description={t("products.fields.discountable.hint")}
          optional
          data-testid="product-create-organize-section-discountable-switch"
        />
        <SwitchBox
          control={form.control}
          name="globally_available"
          label={t("products.fields.globally_available.label")}
          description={t("products.fields.globally_available.hint")}
          optional
          data-testid="product-create-organize-section-globally-available-switch"
        />
      </div>
      {!isGloballyAvailable && (
        <Form.Field
          control={form.control}
          name="seller_ids"
          render={({ field }) => {
            return (
              <Form.Item data-testid="product-create-organize-section-stores-item">
                <Form.Label data-testid="product-create-organize-section-stores-label">
                  {t("products.fields.stores.label")}
                </Form.Label>
                <ConditionalTooltip
                  showTooltip={sellersGate.denied}
                  content={sellersGate.tooltip}
                >
                  <div>
                    <Form.Control data-testid="product-create-organize-section-stores-control">
                      <Combobox
                        {...field}
                        value={field.value ?? []}
                        disabled={sellersGate.denied}
                        options={sellers.options}
                        searchValue={sellers.searchValue}
                        onSearchValueChange={sellers.onSearchValueChange}
                        fetchNextPage={sellers.fetchNextPage}
                        data-testid="product-create-organize-section-stores-input"
                      />
                    </Form.Control>
                  </div>
                </ConditionalTooltip>
                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
      )}
    </div>
  )
}
