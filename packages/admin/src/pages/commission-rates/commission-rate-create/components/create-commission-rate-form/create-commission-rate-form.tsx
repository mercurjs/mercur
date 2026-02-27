import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  CurrencyInput,
  Divider,
  Heading,
  Hint,
  Input,
  Label,
  Select,
  Text,
  clx,
  toast,
  Switch,
} from "@medusajs/ui";
import { MagnifyingGlass } from "@medusajs/icons";
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../../../components/common/form";
import { PercentageInput } from "../../../../../components/inputs/percentage-input";
import {
  RouteFocusModal,
  StackedFocusModal,
  useRouteModal,
  useStackedModal,
} from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useCreateCommissionRate } from "../../../../../hooks/api/commission-rates";
import { currencies as currencyData } from "../../../../../lib/data/currencies";
import { HttpTypes } from "@mercurjs/types";
import { TargetForm } from "../../../../tax-regions/common/components/target-form/target-form";
import { TargetItem } from "../../../../tax-regions/common/components/target-item/target-item";
import { TaxRateRuleReferenceType } from "../../../../tax-regions/common/constants";
import {
  TaxRateRuleReference,
  TaxRateRuleReferenceSchema,
} from "../../../../tax-regions/common/schemas";
import { useDocumentDirection } from "../../../../../hooks/use-document-direction";

const STACKED_MODAL_ID = "cr";
const getStackedModalId = (type: TaxRateRuleReferenceType) =>
  `${STACKED_MODAL_ID}-${type}`;

const CreateCommissionRateSchema = zod.object({
  name: zod.string().min(1),
  code: zod.string().min(1),
  type: zod.enum(["fixed", "percentage"]),
  target: zod.enum(["item", "shipping"]),
  value: zod.coerce.number().min(0),
  currency_code: zod.string().optional(),
  min_amount: zod.coerce.number().optional(),
  include_tax: zod.boolean(),
  is_enabled: zod.boolean(),
  priority: zod.coerce.number().int().min(0),
  enabled_rules: zod.object({
    product: zod.boolean(),
    product_type: zod.boolean(),
    shipping_option: zod.boolean(),
  }),
  product: zod.array(TaxRateRuleReferenceSchema).optional(),
  product_type: zod.array(TaxRateRuleReferenceSchema).optional(),
  shipping_option: zod.array(TaxRateRuleReferenceSchema).optional(),
});

export const CreateCommissionRateForm = ({
  store,
}: {
  store: HttpTypes.AdminStore;
}) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { setIsOpen } = useStackedModal();
  const direction = useDocumentDirection();

  const form = useForm<zod.infer<typeof CreateCommissionRateSchema>>({
    defaultValues: {
      name: "",
      code: "",
      type: "percentage",
      target: "item",
      value: 0,
      currency_code: "",
      min_amount: undefined,
      include_tax: false,
      is_enabled: true,
      priority: 0,
      enabled_rules: {
        product: false,
        product_type: false,
        shipping_option: false,
      },
      product: [],
      product_type: [],
      shipping_option: [],
    },
    resolver: zodResolver(CreateCommissionRateSchema),
  });

  const storeCurrencies = (store?.supported_currencies ?? []).map(
    (c) => currencyData[c.currency_code.toUpperCase()],
  );

  const defaultCurrencyCode =
    store?.supported_currencies?.[0]?.currency_code ?? "";

  useEffect(() => {
    if (defaultCurrencyCode && !form.getValues("currency_code")) {
      form.setValue("currency_code", defaultCurrencyCode);
    }
  }, [defaultCurrencyCode, form]);

  const { mutateAsync: createCommissionRate, isPending } =
    useCreateCommissionRate();

  const handleSubmit = form.handleSubmit(async (values) => {
    const rules = [
      ...(values.product || []).map((ref) => ({
        reference: TaxRateRuleReferenceType.PRODUCT,
        reference_id: ref.value,
      })),
      ...(values.product_type || []).map((ref) => ({
        reference: TaxRateRuleReferenceType.PRODUCT_TYPE,
        reference_id: ref.value,
      })),
      ...(values.shipping_option || []).map((ref) => ({
        reference: TaxRateRuleReferenceType.SHIPPING_OPTION,
        reference_id: ref.value,
      })),
    ];

    await createCommissionRate(
      {
        name: values.name,
        code: values.code,
        type: values.type,
        target: values.target,
        value: values.value,
        currency_code: values.currency_code || null,
        min_amount: values.min_amount ?? null,
        include_tax: values.include_tax,
        is_enabled: values.is_enabled,
        priority: values.priority,
        ...(rules.length > 0 ? { rules } : {}),
      },
      {
        onSuccess: ({ commission_rate }) => {
          toast.success("Commission rate created successfully");
          handleSuccess(`../${commission_rate.id}`);
        },
        onError: (e) => {
          toast.error(e.message);
        },
      },
    );
  });

  const watchType = form.watch("type");
  const watchCurrency = form.watch("currency_code");

  const products = useFieldArray({
    control: form.control,
    name: TaxRateRuleReferenceType.PRODUCT,
  });

  const productTypes = useFieldArray({
    control: form.control,
    name: TaxRateRuleReferenceType.PRODUCT_TYPE,
  });

  const shippingOptions = useFieldArray({
    control: form.control,
    name: TaxRateRuleReferenceType.SHIPPING_OPTION,
  });

  const getControls = (type: TaxRateRuleReferenceType) => {
    switch (type) {
      case TaxRateRuleReferenceType.PRODUCT:
        return products;
      case TaxRateRuleReferenceType.PRODUCT_TYPE:
        return productTypes;
      case TaxRateRuleReferenceType.SHIPPING_OPTION:
        return shippingOptions;
    }
  };

  const referenceTypeOptions = [
    {
      value: TaxRateRuleReferenceType.PRODUCT,
      label: t("taxRegions.fields.targets.options.product"),
    },
    {
      value: TaxRateRuleReferenceType.PRODUCT_TYPE,
      label: t("taxRegions.fields.targets.options.productType"),
    },
    {
      value: TaxRateRuleReferenceType.SHIPPING_OPTION,
      label: t("taxRegions.fields.targets.options.shippingOption"),
    },
  ];

  const searchPlaceholders = {
    [TaxRateRuleReferenceType.PRODUCT]: t(
      "taxRegions.fields.targets.placeholders.product",
    ),
    [TaxRateRuleReferenceType.PRODUCT_TYPE]: t(
      "taxRegions.fields.targets.placeholders.productType",
    ),
    [TaxRateRuleReferenceType.SHIPPING_OPTION]: t(
      "taxRegions.fields.targets.placeholders.shippingOption",
    ),
  };

  const getFieldHandler = (type: TaxRateRuleReferenceType) => {
    const { fields, remove, append } = getControls(type);
    const modalId = getStackedModalId(type);

    return (references: TaxRateRuleReference[]) => {
      if (!references.length) {
        form.setValue(type, [], { shouldDirty: true });
        setIsOpen(modalId, false);
        return;
      }

      const newIds = references.map((reference) => reference.value);

      const fieldsToAdd = references.filter(
        (reference) => !fields.some((field) => field.value === reference.value),
      );

      for (const field of fields) {
        if (!newIds.includes(field.value)) {
          remove(fields.indexOf(field));
        }
      }

      append(fieldsToAdd);
      setIsOpen(modalId, false);
    };
  };

  const displayOrder = new Set<TaxRateRuleReferenceType>();

  const disableRule = (type: TaxRateRuleReferenceType) => {
    form.setValue(type, [], { shouldDirty: true });
    form.setValue(`enabled_rules.${type}`, false, { shouldDirty: true });
    displayOrder.delete(type);
  };

  const enableRule = (type: TaxRateRuleReferenceType) => {
    form.setValue(`enabled_rules.${type}`, true, { shouldDirty: true });
    form.setValue(type, [], { shouldDirty: true });
    displayOrder.add(type);
  };

  const watchedEnabledRules = useWatch({
    control: form.control,
    name: "enabled_rules",
  });

  const addRule = () => {
    const firstDisabledRule = Object.keys(watchedEnabledRules).find(
      (key) => !watchedEnabledRules[key as TaxRateRuleReferenceType],
    );

    if (firstDisabledRule) {
      enableRule(firstDisabledRule as TaxRateRuleReferenceType);
    }
  };

  const visibleRuleTypes = referenceTypeOptions
    .filter((option) => watchedEnabledRules[option.value])
    .sort((a, b) => {
      const orderArray = Array.from(displayOrder);
      return orderArray.indexOf(b.value) - orderArray.indexOf(a.value);
    });

  const getAvailableRuleTypes = (type: TaxRateRuleReferenceType) => {
    return referenceTypeOptions.filter((option) => {
      return (
        !visibleRuleTypes.some(
          (visibleOption) => visibleOption.value === option.value,
        ) || option.value === type
      );
    });
  };

  const showAddButton = Object.values(watchedEnabledRules).some(
    (value) => !value,
  );

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex overflow-hidden">
          <div
            className={clx(
              "flex h-full w-full flex-col items-center overflow-y-auto p-16",
            )}
          >
            <div className="flex w-full max-w-[720px] flex-col gap-y-8">
              <div>
                <Heading>Create Commission Rate</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Configure a new commission rate for your marketplace.
                </Text>
              </div>
              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Name</Form.Label>
                        <Form.Control>
                          <Input {...field} />
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
                        <Form.Label>Code</Form.Label>
                        <Form.Control>
                          <Input {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="type"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Type</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              <Select.Item value="percentage">
                                Percentage
                              </Select.Item>
                              <Select.Item value="fixed">Fixed</Select.Item>
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="target"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Target</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              <Select.Item value="item">Item</Select.Item>
                              <Select.Item value="shipping">
                                Shipping
                              </Select.Item>
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="currency_code"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Currency Code</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value placeholder="Select currency" />
                            </Select.Trigger>
                            <Select.Content>
                              {storeCurrencies.map((currency) => (
                                <Select.Item
                                  value={currency.code.toLowerCase()}
                                  key={currency.code}
                                >
                                  {currency.name}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="value"
                    render={({ field: { value, onChange, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Rate</Form.Label>
                        <Form.Control>
                          {watchType === "percentage" ? (
                            <PercentageInput
                              {...field}
                              value={value}
                              onValueChange={(_value, _name, values) =>
                                onChange(values?.float ?? 0)
                              }
                            />
                          ) : (
                            <CurrencyInput
                              {...field}
                              min={0}
                              code={watchCurrency || defaultCurrencyCode}
                              onValueChange={(_value, _name, values) =>
                                onChange(values?.float ?? 0)
                              }
                            />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="min_amount"
                    render={({ field: { value, onChange, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Minimum Amount</Form.Label>
                        <Form.Control>
                          <CurrencyInput
                            {...field}
                            min={0}
                            code={watchCurrency || defaultCurrencyCode}
                            value={value}
                            onValueChange={(_value, _name, values) =>
                              onChange(values?.float ?? 0)
                            }
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Priority</Form.Label>
                        <Form.Control>
                          <Input type="number" {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
              </div>
              <Form.Field
                control={form.control}
                name="is_enabled"
                render={({ field: { value, onChange, ...field } }) => (
                  <Form.Item>
                    <div className="flex items-start justify-between">
                      <Form.Label>Enabled</Form.Label>
                      <Form.Control>
                        <Switch
                          {...field}
                          checked={value}
                          onCheckedChange={onChange}
                        />
                      </Form.Control>
                    </div>
                    <Form.Hint>
                      Enable or disable this commission rate.
                    </Form.Hint>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="include_tax"
                render={({ field: { value, onChange, ...field } }) => (
                  <Form.Item>
                    <div className="flex items-start justify-between">
                      <Form.Label>Include Tax</Form.Label>
                      <Form.Control>
                        <Switch
                          {...field}
                          checked={value}
                          onCheckedChange={onChange}
                        />
                      </Form.Control>
                    </div>
                    <Form.Hint>
                      Include tax in the commission calculation.
                    </Form.Hint>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <div className="flex flex-col gap-y-3">
                <div className="flex items-center justify-between gap-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-x-1">
                      <Label
                        id="commission_rules_label"
                        htmlFor="commission_rules"
                      >
                        {t("taxRegions.fields.targets.label")}
                      </Label>
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-muted"
                      >
                        ({t("fields.optional")})
                      </Text>
                    </div>
                    <Hint
                      id="commission_rules_description"
                      className="text-pretty"
                    >
                      {t("taxRegions.fields.targets.hint")}
                    </Hint>
                  </div>
                  {showAddButton && (
                    <Button
                      onClick={addRule}
                      type="button"
                      size="small"
                      variant="transparent"
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover flex-shrink-0"
                    >
                      {t("taxRegions.fields.targets.action")}
                    </Button>
                  )}
                </div>
                <div
                  id="commission_rules"
                  aria-labelledby="commission_rules_label"
                  aria-describedby="commission_rules_description"
                  role="application"
                  className="flex flex-col gap-y-3"
                >
                  {visibleRuleTypes.map((ruleType, index) => {
                    const type = ruleType.value;
                    const label = ruleType.label;
                    const isLast = index === visibleRuleTypes.length - 1;
                    const searchPlaceholder = searchPlaceholders[type];

                    const options = getAvailableRuleTypes(type);

                    const { fields, remove } = getControls(type);
                    const handler = getFieldHandler(type);

                    const modalId = getStackedModalId(type);

                    const handleChangeType = (
                      value: TaxRateRuleReferenceType,
                    ) => {
                      disableRule(type);
                      enableRule(value);
                    };

                    return (
                      <div key={type}>
                        <Form.Field
                          control={form.control}
                          name={ruleType.value}
                          render={({ field }) => {
                            return (
                              <Form.Item className="space-y-0">
                                <Form.Label className="sr-only">
                                  {label}
                                </Form.Label>
                                <div
                                  className={clx(
                                    "bg-ui-bg-component shadow-elevation-card-rest transition-fg grid gap-1.5 rounded-xl py-1.5",
                                    "aria-[invalid='true']:shadow-borders-error",
                                  )}
                                  role="application"
                                  {...field}
                                >
                                  <div className="text-ui-fg-subtle grid gap-1.5 px-1.5 md:grid-cols-2">
                                    {isLast ? (
                                      <Select
                                        dir={direction}
                                        value={type}
                                        onValueChange={handleChangeType}
                                      >
                                        <Select.Trigger className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover">
                                          <Select.Value />
                                        </Select.Trigger>
                                        <Select.Content>
                                          {options.map((option) => {
                                            return (
                                              <Select.Item
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </Select.Item>
                                            );
                                          })}
                                        </Select.Content>
                                      </Select>
                                    ) : (
                                      <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
                                        {label}
                                      </div>
                                    )}
                                    <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
                                      {t(
                                        "taxRegions.fields.targets.operators.in",
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-1.5">
                                    <StackedFocusModal id={modalId}>
                                      <StackedFocusModal.Trigger asChild>
                                        <button
                                          type="button"
                                          className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover shadow-borders-base txt-compact-small text-ui-fg-muted transition-fg focus-visible:shadow-borders-interactive-with-active flex flex-1 items-center gap-x-2 rounded-md px-2 py-1.5 outline-none"
                                        >
                                          <MagnifyingGlass />
                                          {searchPlaceholder}
                                        </button>
                                      </StackedFocusModal.Trigger>
                                      <StackedFocusModal.Trigger asChild>
                                        <Button variant="secondary">
                                          {t("actions.browse")}
                                        </Button>
                                      </StackedFocusModal.Trigger>
                                      <StackedFocusModal.Content>
                                        <StackedFocusModal.Header>
                                          <StackedFocusModal.Title asChild>
                                            <Heading className="sr-only">
                                              {t(
                                                "taxRegions.fields.targets.modal.header",
                                              )}
                                            </Heading>
                                          </StackedFocusModal.Title>
                                          <StackedFocusModal.Description className="sr-only">
                                            {t(
                                              "taxRegions.fields.targets.hint",
                                            )}
                                          </StackedFocusModal.Description>
                                        </StackedFocusModal.Header>
                                        <TargetForm
                                          type="focus"
                                          referenceType={type}
                                          state={fields}
                                          setState={handler}
                                        />
                                      </StackedFocusModal.Content>
                                    </StackedFocusModal>
                                    <Button
                                      variant="secondary"
                                      onClick={() => disableRule(type)}
                                      type="button"
                                    >
                                      {t("actions.delete")}
                                    </Button>
                                  </div>
                                  {fields.length > 0 ? (
                                    <div className="flex flex-col gap-y-1.5">
                                      <Divider variant="dashed" />
                                      <div className="flex flex-col gap-y-1.5 px-1.5">
                                        {fields.map((field, index) => {
                                          return (
                                            <TargetItem
                                              key={field.id}
                                              index={index}
                                              label={field.label}
                                              onRemove={remove}
                                              value={field.value}
                                            />
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                                <Form.ErrorMessage className="mt-2" />
                              </Form.Item>
                            );
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button size="small" type="submit" isLoading={isPending}>
            {t("actions.save")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
