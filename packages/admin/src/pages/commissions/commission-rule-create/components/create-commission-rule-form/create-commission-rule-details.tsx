import { Heading, Input } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Combobox } from "../../../../../components/inputs/combobox";
import { Form } from "../../../../../components/common/form";
import { defineTabMeta } from "../../../../../components/tabbed-form";
import { useTabbedForm } from "../../../../../components/tabbed-form";
import { useComboboxData } from "../../../../../hooks/use-combobox-data";
import { sdk } from "../../../../../lib/client";
import { SCOPE_TYPE_DIMENSIONS } from "../../../common/types";
import { CreateCommissionRuleSchemaType } from "./schema";

export const CreateCommissionRuleDetails = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<CreateCommissionRuleSchemaType>();

  const scopeType = form.watch("scopeType");
  const dimensions = SCOPE_TYPE_DIMENSIONS[scopeType];

  const scopeTypeOptions = [
    { value: "store", label: t("commissions.fields.scopeType.store") },
    {
      value: "product_type",
      label: t("commissions.fields.scopeType.productType"),
    },
    { value: "category", label: t("commissions.fields.scopeType.category") },
    {
      value: "store_product_type",
      label: t("commissions.fields.scopeType.storeProductType"),
    },
    {
      value: "store_category",
      label: t("commissions.fields.scopeType.storeCategory"),
    },
  ];

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
          name="code"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t("commissions.fields.code")}</Form.Label>
              <Form.Control>
                <Input
                  autoComplete="off"
                  data-testid="commission-rule-code-input"
                  {...field}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="scopeType"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("commissions.fields.scopeType.label")}
              </Form.Label>
              <Form.Control>
                <Combobox
                  {...field}
                  options={scopeTypeOptions}
                  forceHideInput
                  data-testid="commission-rule-scope-type-select"
                />
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
                    {...field}
                    value={field.value ?? []}
                    options={stores.options}
                    searchValue={stores.searchValue}
                    onSearchValueChange={stores.onSearchValueChange}
                    fetchNextPage={stores.fetchNextPage}
                    data-testid="commission-rule-stores-input"
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
                    {...field}
                    value={field.value ?? []}
                    options={productTypes.options}
                    searchValue={productTypes.searchValue}
                    onSearchValueChange={productTypes.onSearchValueChange}
                    fetchNextPage={productTypes.fetchNextPage}
                    data-testid="commission-rule-product-types-input"
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
                    {...field}
                    value={field.value ?? []}
                    options={categories.options}
                    searchValue={categories.searchValue}
                    onSearchValueChange={categories.onSearchValueChange}
                    fetchNextPage={categories.fetchNextPage}
                    data-testid="commission-rule-categories-input"
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
      "code",
      "scopeType",
      "stores",
      "productTypes",
      "categories",
    ],
  }
);
