import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

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

  const collections = useComboboxData({
    queryKey: ["product_collections"],
    queryFn: (params) => sdk.admin.collections.query(params),
    getOptions: (data) =>
      data.collections.map((collection) => ({
        label: collection.title!,
        value: collection.id!,
      })),
  })

  const types = useComboboxData({
    queryKey: ["product_types"],
    queryFn: (params) => sdk.admin.productTypes.query(params),
    getOptions: (data) =>
      data.product_types.map((type) => ({
        label: type.value,
        value: type.id,
      })),
  })

  const tags = useComboboxData({
    queryKey: ["product_tags"],
    queryFn: (params) => sdk.admin.productTags.query(params),
    getOptions: (data) =>
      data.product_tags.map((tag) => ({
        label: tag.value,
        value: tag.id,
      })),
  })

  return (
    <div id="organize" className="flex flex-col gap-y-8" data-testid="product-create-organize-section">
      <Heading data-testid="product-create-organize-section-heading">{t("products.organization.header")}</Heading>
      <SwitchBox
        control={form.control}
        name="discountable"
        label={t("products.fields.discountable.label")}
        description={t("products.fields.discountable.hint")}
        optional
        data-testid="product-create-organize-section-discountable-switch"
      />
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
                <Form.Control data-testid="product-create-organize-section-collection-control">
                  <Combobox
                    {...field}
                    options={collections.options}
                    searchValue={collections.searchValue}
                    onSearchValueChange={collections.onSearchValueChange}
                    fetchNextPage={collections.fetchNextPage}
                    data-testid="product-create-organize-section-collection-input"
                  />
                </Form.Control>
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
                <Form.Control data-testid="product-create-organize-section-type-control">
                  <Combobox
                    {...field}
                    options={types.options}
                    searchValue={types.searchValue}
                    onSearchValueChange={types.onSearchValueChange}
                    fetchNextPage={types.fetchNextPage}
                    data-testid="product-create-organize-section-type-input"
                  />
                </Form.Control>
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
                <Form.Control data-testid="product-create-organize-section-tags-control">
                  <Combobox
                    {...field}
                    options={tags.options}
                    searchValue={tags.searchValue}
                    onSearchValueChange={tags.onSearchValueChange}
                    fetchNextPage={tags.fetchNextPage}
                    data-testid="product-create-organize-section-tags-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
      </div>
    </div>
  )
}
