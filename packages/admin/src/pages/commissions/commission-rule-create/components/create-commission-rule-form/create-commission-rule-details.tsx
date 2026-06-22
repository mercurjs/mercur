import { Heading, Input, RadioGroup } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Combobox } from "../../../../../components/inputs/combobox";
import { Form } from "../../../../../components/common/form";
import { defineTabMeta } from "../../../../../components/tabbed-form";
import { useTabbedForm } from "../../../../../components/tabbed-form";
import { useComboboxData } from "../../../../../hooks/use-combobox-data";
import { sdk } from "../../../../../lib/client";
import { useDocumentDirection } from "../../../../../hooks/use-document-direction";
import { SCOPE_TYPE_DIMENSIONS } from "../../../common/types";
import { CreateCommissionRuleSchemaType } from "./schema";

export const CreateCommissionRuleDetails = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<CreateCommissionRuleSchemaType>();
  const direction = useDocumentDirection();

  const scopeType = form.watch("scopeType");
  const dimensions = SCOPE_TYPE_DIMENSIONS[scopeType];

  const stores = useComboboxData({
    queryKey: ["commission_stores"],
    queryFn: (params) => sdk.admin.sellers.query({ ...params }),
    getOptions: (data) =>
      data.sellers.map((s: { id: string; name: string }) => ({
        label: s.name,
        value: s.id,
      })),
  });

  const productTypes = useComboboxData({
    queryKey: ["commission_product_types"],
    queryFn: (params) => sdk.admin.productTypes.query({ ...params }),
    getOptions: (data) =>
      data.product_types.map((pt: { id: string; value: string }) => ({
        label: pt.value,
        value: pt.id,
      })),
  });

  const categories = useComboboxData({
    queryKey: ["commission_categories"],
    queryFn: (params) => sdk.admin.productCategories.query({ ...params }),
    getOptions: (data) =>
      data.product_categories.map((c: { id: string; name: string }) => ({
        label: c.name,
        value: c.id,
      })),
  });

  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <Heading>{t("commissions.create.details", "Details")}</Heading>
        <div className="flex flex-col gap-y-4">
        <Form.Field
          control={form.control}
          name="title"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t("fields.title")}</Form.Label>
              <Form.Control>
                <Input autoComplete="off" {...field} />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="scopeType"
          render={({ field: { onChange, ...rest } }) => (
            <Form.Item>
              <Form.Label>
                {t("commissions.fields.scopeType.label", "Type")}
              </Form.Label>
              <Form.Control>
                <RadioGroup
                  dir={direction}
                  onValueChange={onChange}
                  {...rest}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  data-testid="commission-rule-scope-type-radio-group"
                >
                  <RadioGroup.ChoiceBox
                    value="store"
                    label={t("commissions.fields.scopeType.store", "Store")}
                    description={t(
                      "commissions.fields.scopeType.storeHint",
                      "Apply to specific stores."
                    )}
                    data-testid="commission-rule-scope-type-option-store"
                  />
                  <RadioGroup.ChoiceBox
                    value="product_type"
                    label={t(
                      "commissions.fields.scopeType.productType",
                      "Product Type"
                    )}
                    description={t(
                      "commissions.fields.scopeType.productTypeHint",
                      "Apply to specific product types."
                    )}
                    data-testid="commission-rule-scope-type-option-product-type"
                  />
                  <RadioGroup.ChoiceBox
                    value="category"
                    label={t(
                      "commissions.fields.scopeType.category",
                      "Category"
                    )}
                    description={t(
                      "commissions.fields.scopeType.categoryHint",
                      "Apply to specific categories."
                    )}
                    data-testid="commission-rule-scope-type-option-category"
                  />
                  <RadioGroup.ChoiceBox
                    value="store_product_type"
                    label={t(
                      "commissions.fields.scopeType.storeProductType",
                      "Store + Product Type"
                    )}
                    description={t(
                      "commissions.fields.scopeType.storeProductTypeHint",
                      "Apply to product types within specific stores."
                    )}
                    data-testid="commission-rule-scope-type-option-store-product-type"
                  />
                  <RadioGroup.ChoiceBox
                    value="store_category"
                    label={t(
                      "commissions.fields.scopeType.storeCategory",
                      "Store + Category"
                    )}
                    description={t(
                      "commissions.fields.scopeType.storeCategoryHint",
                      "Apply to categories within specific stores."
                    )}
                    data-testid="commission-rule-scope-type-option-store-category"
                  />
                </RadioGroup>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        {dimensions.includes("seller") && (
          <Form.Field
            control={form.control}
            name="stores"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t("commissions.fields.stores", "Stores")}
                </Form.Label>
                <Form.Control>
                  <Combobox
                    options={stores.options}
                    fetchNextPage={stores.fetchNextPage}
                    searchValue={stores.searchValue}
                    onSearchValueChange={stores.onSearchValueChange}
                    {...field}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        )}
        {dimensions.includes("product_type") && (
          <Form.Field
            control={form.control}
            name="productTypes"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t("commissions.fields.productTypes", "Product Types")}
                </Form.Label>
                <Form.Control>
                  <Combobox
                    options={productTypes.options}
                    fetchNextPage={productTypes.fetchNextPage}
                    searchValue={productTypes.searchValue}
                    onSearchValueChange={productTypes.onSearchValueChange}
                    {...field}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        )}
        {dimensions.includes("product_category") && (
          <Form.Field
            control={form.control}
            name="categories"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t("commissions.fields.categories", "Categories")}
                </Form.Label>
                <Form.Control>
                  <Combobox
                    options={categories.options}
                    fetchNextPage={categories.fetchNextPage}
                    searchValue={categories.searchValue}
                    onSearchValueChange={categories.onSearchValueChange}
                    {...field}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        )}
        </div>
      </div>
    </div>
  );
};

CreateCommissionRuleDetails._tabMeta = defineTabMeta<CreateCommissionRuleSchemaType>(
  {
    id: "details",
    labelKey: "commissions.create.details",
    validationFields: [
      "title",
      "scopeType",
      "stores",
      "productTypes",
      "categories",
    ],
  }
);
