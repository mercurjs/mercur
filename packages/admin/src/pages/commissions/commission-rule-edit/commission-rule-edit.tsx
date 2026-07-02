import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Select, toast } from "@medusajs/ui";
import i18n from "i18next";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as zod from "zod";

import { Combobox } from "../../../components/inputs/combobox";
import { Form } from "../../../components/common/form";
import { RouteDrawer, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import { useComboboxData } from "../../../hooks/use-combobox-data";
import { useDocumentDirection } from "../../../hooks/use-document-direction";
import {
  useBatchCommissionRules,
  useCommissionRule,
  useUpdateCommissionRule,
} from "../../../hooks/api/commissions";
import { sdk } from "../../../lib/client";
import { CommissionRate, SCOPE_TYPE_DIMENSIONS } from "../common/types";
import {
  buildRulesFromScope,
  deriveScopeType,
  diffScopeRules,
  referenceIds,
} from "../common/utils";

const EditCommissionRuleSchema = zod.object({
  status: zod.enum(["active", "inactive"]),
  name: zod
    .string()
    .min(1, { message: i18n.t("commissions.validation.titleRequired") }),
  code: zod
    .string()
    .min(1, { message: i18n.t("commissions.validation.codeRequired") }),
  scopeType: zod.enum([
    "store",
    "product_type",
    "category",
    "store_product_type",
    "store_category",
  ]),
  stores: zod.array(zod.string()),
  productTypes: zod.array(zod.string()),
  categories: zod.array(zod.string()),
}).superRefine((data, ctx) => {
  const dimensions = SCOPE_TYPE_DIMENSIONS[data.scopeType];

  if (dimensions.includes("seller") && data.stores.length === 0) {
    ctx.addIssue({
      code: zod.ZodIssueCode.custom,
      path: ["stores"],
      message: i18n.t("commissions.validation.storesRequired"),
    });
  }
  if (dimensions.includes("product_type") && data.productTypes.length === 0) {
    ctx.addIssue({
      code: zod.ZodIssueCode.custom,
      path: ["productTypes"],
      message: i18n.t("commissions.validation.productTypesRequired"),
    });
  }
  if (dimensions.includes("product_category") && data.categories.length === 0) {
    ctx.addIssue({
      code: zod.ZodIssueCode.custom,
      path: ["categories"],
      message: i18n.t("commissions.validation.categoriesRequired"),
    });
  }
});

type EditCommissionRuleSchemaType = zod.infer<typeof EditCommissionRuleSchema>;

const EditCommissionRuleForm = ({ rule }: { rule: CommissionRate }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();

  const form = useForm<EditCommissionRuleSchemaType>({
    defaultValues: {
      status: rule.is_enabled ? "active" : "inactive",
      name: rule.name,
      code: rule.code,
      scopeType: deriveScopeType(rule.rules) ?? "store",
      stores: referenceIds(rule.rules, "seller"),
      productTypes: referenceIds(rule.rules, "product_type"),
      categories: referenceIds(rule.rules, "product_category"),
    },
    resolver: zodResolver(EditCommissionRuleSchema),
  });

  const { mutateAsync: updateRule, isPending: isUpdating } =
    useUpdateCommissionRule(rule.id);
  const { mutateAsync: batchRules, isPending: isBatching } =
    useBatchCommissionRules(rule.id);

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

  const scopeType = form.watch("scopeType");
  const dimensions = SCOPE_TYPE_DIMENSIONS[scopeType];

  const handleSubmit = form.handleSubmit(async (values) => {
    const desired = buildRulesFromScope(values.scopeType, {
      stores: values.stores,
      productTypes: values.productTypes,
      categories: values.categories,
    });
    const ruleDiff = diffScopeRules(rule.rules, desired);

    try {
      await updateRule({
        name: values.name,
        code: values.code,
        is_enabled: values.status === "active",
      });

      if (ruleDiff.create.length > 0 || ruleDiff.delete.length > 0) {
        await batchRules({
          create: ruleDiff.create,
          delete: ruleDiff.delete,
        });
      }

      toast.success(
        t("commissions.edit.successToast")
      );
      handleSuccess();
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="status"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>
                    {t("commissions.fields.status")}
                  </Form.Label>
                  <Form.Control>
                    <Select {...field} onValueChange={onChange} dir={direction}>
                      <Select.Trigger
                        ref={ref}
                        data-testid="commission-rule-edit-status-select"
                      >
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="active">
                          {t("commissions.status.enabled")}
                        </Select.Item>
                        <Select.Item value="inactive">
                          {t("commissions.status.disabled")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.title")}</Form.Label>
                  <Form.Control>
                    <Input
                      autoComplete="off"
                      data-testid="commission-rule-edit-title-input"
                      {...field}
                    />
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
                      data-testid="commission-rule-edit-code-input"
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
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>
                    {t("commissions.fields.scopeType.label")}
                  </Form.Label>
                  <Form.Control>
                    <Select {...field} onValueChange={onChange} dir={direction}>
                      <Select.Trigger
                        ref={ref}
                        data-testid="commission-rule-edit-type-select"
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
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isUpdating || isBatching}
              data-testid="commission-rule-edit-submit"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};

export const CommissionRuleEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { commission_rate, isPending, isError, error } = useCommissionRule(
    id!,
    { fields: "*rules,*values" }
  ) as unknown as {
    commission_rate?: CommissionRate;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };

  const ready = !isPending && !!commission_rate;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {t("commissions.edit.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("commissions.edit.header")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCommissionRuleForm rule={commission_rate} />}
    </RouteDrawer>
  );
};
