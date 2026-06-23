import { Heading, Input, Select } from "@medusajs/ui";
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
        <Heading>{t("commissions.create.details")}</Heading>
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
          render={({ field: { onChange, ref, ...field } }) => (
            <Form.Item>
              <Form.Label>
                {t("commissions.fields.scopeType.label")}
              </Form.Label>
              <Form.Control>
                <Select {...field} onValueChange={onChange} dir={direction}>
                  <Select.Trigger
                    ref={ref}
                    data-testid="commission-rule-scope-type-select"
                  >
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="store">
                      {t("commissions.fields.scopeType.store")}
                    </Select.Item>
                    <Select.Item value="product_type">
                      {t("commissions.fields.scopeType.productType")}
                    </Select.Item>
                    <Select.Item value="category">
                      {t("commissions.fields.scopeType.category")}
                    </Select.Item>
                    <Select.Item value="store_product_type">
                      {t("commissions.fields.scopeType.storeProductType")}
                    </Select.Item>
                    <Select.Item value="store_category">
                      {t("commissions.fields.scopeType.storeCategory")}
                    </Select.Item>
                  </Select.Content>
                </Select>
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
                  {t("commissions.fields.stores")}
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
                  {t("commissions.fields.productTypes")}
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
                  {t("commissions.fields.categories")}
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
