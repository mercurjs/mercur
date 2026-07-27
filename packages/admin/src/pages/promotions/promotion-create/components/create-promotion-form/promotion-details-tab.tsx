import { useEffect, useState } from "react";

import type { ApplicationMethodAllocationValues } from "@medusajs/types";
import {
  Alert,
  Badge,
  clx,
  CurrencyInput,
  Divider,
  Heading,
  InlineTip,
  Input,
  RadioGroup,
  Text,
} from "@medusajs/ui";
import { useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

import { Form } from "../../../../../components/common/form";
import { DeprecatedPercentageInput } from "../../../../../components/inputs/percentage-input";
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form";
import { defineTabMeta } from "../../../../../components/tabbed-form/types";
import { Combobox } from "../../../../../components/inputs/combobox";
import { useComboboxData } from "../../../../../hooks/use-combobox-data";
import { useDocumentDirection } from "../../../../../hooks/use-document-direction";
import { sdk } from "../../../../../lib/client";
import {
  currencies,
  getCurrencySymbol,
} from "../../../../../lib/data/currencies";
import { RulesFormField } from "../../../common/edit-rules/components/rules-form-field";
import { CreatePromotionSchemaType } from "./form-schema";
import { SwitchBox } from "@mercurjs/dashboard-shared";

type AllocationMode = "each" | "across" | "once";

type PromotionDetailsTabProps = {
  currentTemplate?: {
    id: string;
    titleKey: string;
    hiddenFields: string[];
  };
};

const Root = ({ currentTemplate }: PromotionDetailsTabProps) => {
  const { t } = useTranslation();
  const direction = useDocumentDirection();
  const form = useTabbedForm<CreatePromotionSchemaType>();
  const { setValue } = form;

  const [allocationMode, setAllocationMode] = useState<AllocationMode>("each");

  const watchValueType = useWatch({
    control: form.control,
    name: "application_method.type",
  });
  const isFixedValueType = watchValueType === "fixed";

  const watchAllocation = useWatch({
    control: form.control,
    name: "application_method.allocation",
  });

  useEffect(() => {
    if (watchAllocation) {
      setAllocationMode(watchAllocation as AllocationMode);
    }
  }, [watchAllocation]);

  const watchType = useWatch({
    control: form.control,
    name: "type",
  });

  const isTypeStandard = watchType === "standard";
  const isTypeBuyGet = watchType === "buyget";

  const targetType = useWatch({
    control: form.control,
    name: "application_method.target_type",
  });

  const isTargetTypeOrder = targetType === "order";

  const watchCostBearer = useWatch({
    control: form.control,
    name: "cost_bearer",
  });
  const isSharedCost = watchCostBearer === "shared";

  const stores = useComboboxData({
    queryKey: ["promotion_stores"],
    queryFn: (params) => sdk.admin.sellers.query({ ...params, fields: "id,name" }),
    getOptions: (data) =>
      data.sellers.map((seller: { id: string; name: string }) => ({
        label: seller.name,
        value: seller.id,
      })),
    enabled: isTypeBuyGet,
  });

  return (
    <div className="flex size-full flex-col items-center">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 py-16">
        <Heading
          level="h1"
          className="text-fg-base"
          data-testid="promotion-create-form-promotion-heading"
        >
          {t(`promotions.sections.details`)}

          {currentTemplate?.titleKey && (
            <Badge
              className="ml-2 align-middle"
              color="grey"
              size="2xsmall"
              rounded="full"
              data-testid="promotion-create-form-promotion-template-badge"
            >
              {t(currentTemplate.titleKey)}
            </Badge>
          )}
        </Heading>

        {form.formState.errors.root && (
          <Alert
            variant="error"
            dismissible={false}
            className="text-balance"
            data-testid="promotion-create-form-promotion-error-alert"
          >
            {form.formState.errors.root.message}
          </Alert>
        )}

        <Form.Field
          control={form.control}
          name="is_automatic"
          render={({ field }) => {
            return (
              <Form.Item data-testid="promotion-create-form-method-item">
                <Form.Label data-testid="promotion-create-form-method-label">
                  {t("promotions.form.method.label")}
                </Form.Label>

                <Form.Control data-testid="promotion-create-form-method-control">
                  <RadioGroup
                    dir={direction}
                    className="flex gap-y-3"
                    {...field}
                    value={field.value}
                    onValueChange={field.onChange}
                    data-testid="promotion-create-form-method-radio-group"
                  >
                    <RadioGroup.ChoiceBox
                      value="false"
                      label={t("promotions.form.method.code.title")}
                      description={t("promotions.form.method.code.description")}
                      className={clx("basis-1/2")}
                      data-testid="promotion-create-form-method-option-code"
                    />

                    <RadioGroup.ChoiceBox
                      value="true"
                      label={t("promotions.form.method.automatic.title")}
                      description={t(
                        "promotions.form.method.automatic.description",
                      )}
                      className={clx("basis-1/2")}
                      data-testid="promotion-create-form-method-option-automatic"
                    />
                  </RadioGroup>
                </Form.Control>
                <Form.ErrorMessage data-testid="promotion-create-form-method-error" />
              </Form.Item>
            );
          }}
        />

        <Form.Field
          control={form.control}
          name="status"
          render={({ field }) => {
            return (
              <Form.Item data-testid="promotion-create-form-status-item">
                <Form.Label data-testid="promotion-create-form-status-label">
                  {t("promotions.form.status.label")}
                </Form.Label>

                <Form.Control data-testid="promotion-create-form-status-control">
                  <RadioGroup
                    dir={direction}
                    className="flex gap-y-3"
                    {...field}
                    value={field.value}
                    onValueChange={field.onChange}
                    data-testid="promotion-create-form-status-radio-group"
                  >
                    <RadioGroup.ChoiceBox
                      value="draft"
                      label={t("promotions.form.status.draft.title")}
                      description={t(
                        "promotions.form.status.draft.description",
                      )}
                      className={clx("basis-1/2")}
                      data-testid="promotion-create-form-status-option-draft"
                    />

                    <RadioGroup.ChoiceBox
                      value="active"
                      label={t("promotions.form.status.active.title")}
                      description={t(
                        "promotions.form.status.active.description",
                      )}
                      className={clx("basis-1/2")}
                      data-testid="promotion-create-form-status-option-active"
                    />
                  </RadioGroup>
                </Form.Control>
                <Form.ErrorMessage data-testid="promotion-create-form-status-error" />
              </Form.Item>
            );
          }}
        />

        <div className="flex gap-y-4">
          <Form.Field
            control={form.control}
            name="code"
            render={({ field }) => {
              return (
                <Form.Item
                  className="basis-1/2"
                  data-testid="promotion-create-form-code-item"
                >
                  <Form.Label data-testid="promotion-create-form-code-label">
                    {t("promotions.form.code.title")}
                  </Form.Label>

                  <Form.Control data-testid="promotion-create-form-code-control">
                    <Input
                      {...field}
                      placeholder="SUMMER15"
                      data-testid="promotion-create-form-code-input"
                    />
                  </Form.Control>

                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                    data-testid="promotion-create-form-code-description"
                  >
                    <Trans
                      t={t}
                      i18nKey="promotions.form.code.description"
                      components={[<br key="break" />]}
                    />
                  </Text>
                  <Form.ErrorMessage data-testid="promotion-create-form-code-error" />
                </Form.Item>
              );
            }}
          />
        </div>

        {!currentTemplate?.hiddenFields?.includes("is_tax_inclusive") && (
          <>
            <SwitchBox
              control={form.control}
              name="is_tax_inclusive"
              label={t("promotions.form.taxInclusive.title")}
              description={t("promotions.form.taxInclusive.description")}
              data-testid="promotion-create-form-tax-inclusive-switch"
            />
          </>
        )}

        <Divider />

        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col">
            <Heading
              level="h2"
              className="mb-2"
              data-testid="promotion-create-form-cost-bearer-label"
            >
              {t("promotions.form.costBearer.label")}
            </Heading>
            <Text
              className="txt-small text-ui-fg-subtle"
              data-testid="promotion-create-form-cost-bearer-description"
            >
              {t("promotions.form.costBearer.description")}
            </Text>
          </div>

          <Form.Field
            control={form.control}
            name="cost_bearer"
            render={({ field }) => {
              return (
                <Form.Item data-testid="promotion-create-form-cost-bearer-item">
                  <Form.Control data-testid="promotion-create-form-cost-bearer-control">
                    <RadioGroup
                      dir={direction}
                      className="flex gap-y-3"
                      {...field}
                      value={field.value}
                      onValueChange={field.onChange}
                      data-testid="promotion-create-form-cost-bearer-radio-group"
                    >
                      <RadioGroup.ChoiceBox
                        value="store"
                        label={t("promotions.form.costBearer.store.title")}
                        description={t(
                          "promotions.form.costBearer.store.description",
                        )}
                        className={clx("basis-1/3")}
                        data-testid="promotion-create-form-cost-bearer-option-store"
                      />

                      <RadioGroup.ChoiceBox
                        value="marketplace"
                        label={t(
                          "promotions.form.costBearer.marketplace.title",
                        )}
                        description={t(
                          "promotions.form.costBearer.marketplace.description",
                        )}
                        className={clx("basis-1/3")}
                        data-testid="promotion-create-form-cost-bearer-option-marketplace"
                      />

                      <RadioGroup.ChoiceBox
                        value="shared"
                        label={t("promotions.form.costBearer.shared.title")}
                        description={t(
                          "promotions.form.costBearer.shared.description",
                        )}
                        className={clx("basis-1/3")}
                        data-testid="promotion-create-form-cost-bearer-option-shared"
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="promotion-create-form-cost-bearer-error" />
                </Form.Item>
              );
            }}
          />

          {isSharedCost && (
            <Form.Field
              control={form.control}
              name="shared_marketplace_percentage"
              render={({ field: { onChange, value, ...field } }) => {
                return (
                  <Form.Item
                    className="basis-1/2"
                    data-testid="promotion-create-form-shared-percentage-item"
                  >
                    <Form.Label data-testid="promotion-create-form-shared-percentage-label">
                      {t("promotions.form.costBearer.sharedPercentage.title")}
                    </Form.Label>

                    <Form.Control data-testid="promotion-create-form-shared-percentage-control">
                      <DeprecatedPercentageInput
                        key="shared-percentage"
                        className="text-right"
                        min={0}
                        max={100}
                        {...field}
                        value={value ?? ""}
                        onChange={(e) => {
                          onChange(
                            e.target.value === ""
                              ? null
                              : parseFloat(e.target.value),
                          );
                        }}
                        data-testid="promotion-create-form-shared-percentage-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="promotion-create-form-shared-percentage-error" />
                  </Form.Item>
                );
              }}
            />
          )}

          <InlineTip
            label={t("general.tip")}
            data-testid="promotion-create-form-cost-bearer-tip"
          >
            {t("promotions.form.costBearer.tip")}
          </InlineTip>
        </div>

        {!currentTemplate?.hiddenFields?.includes("type") && (
          <Form.Field
            control={form.control}
            name="type"
            render={({ field }) => {
              return (
                <Form.Item data-testid="promotion-create-form-type-item">
                  <Form.Label data-testid="promotion-create-form-type-label">
                    {t("promotions.fields.type")}
                  </Form.Label>
                  <Form.Control data-testid="promotion-create-form-type-control">
                    <RadioGroup
                      dir={direction}
                      className="flex gap-y-3"
                      {...field}
                      onValueChange={field.onChange}
                      data-testid="promotion-create-form-type-radio-group"
                    >
                      <RadioGroup.ChoiceBox
                        value="standard"
                        label={t("promotions.form.type.standard.title")}
                        description={t(
                          "promotions.form.type.standard.description",
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-type-option-standard"
                      />

                      <RadioGroup.ChoiceBox
                        value="buyget"
                        label={t("promotions.form.type.buyget.title")}
                        description={t(
                          "promotions.form.type.buyget.description",
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-type-option-buyget"
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="promotion-create-form-type-error" />
                </Form.Item>
              );
            }}
          />
        )}

        <Divider />

        <RulesFormField form={form} ruleType="rules" />

        {!currentTemplate?.hiddenFields?.includes(
          "application_method.type",
        ) && (
          <>
            <Divider />
            <Form.Field
              control={form.control}
              name="application_method.type"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="promotion-create-form-value-type-item">
                    <Form.Label data-testid="promotion-create-form-value-type-label">
                      {t("promotions.fields.value_type")}
                    </Form.Label>
                    <Form.Control data-testid="promotion-create-form-value-type-control">
                      <RadioGroup
                        dir={direction}
                        className="flex gap-y-3"
                        {...field}
                        onValueChange={field.onChange}
                        data-testid="promotion-create-form-value-type-radio-group"
                      >
                        <RadioGroup.ChoiceBox
                          value="fixed"
                          label={t("promotions.form.value_type.fixed.title")}
                          description={t(
                            "promotions.form.value_type.fixed.description",
                          )}
                          className={clx("basis-1/2")}
                          data-testid="promotion-create-form-value-type-option-fixed"
                        />

                        <RadioGroup.ChoiceBox
                          value="percentage"
                          label={t(
                            "promotions.form.value_type.percentage.title",
                          )}
                          description={t(
                            "promotions.form.value_type.percentage.description",
                          )}
                          className={clx("basis-1/2")}
                          data-testid="promotion-create-form-value-type-option-percentage"
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="promotion-create-form-value-type-error" />
                  </Form.Item>
                );
              }}
            />
          </>
        )}

        {!currentTemplate?.hiddenFields?.includes(
          "application_method.allocation",
        ) && (
          <Form.Field
            control={form.control}
            name="application_method.allocation"
            render={({ field }) => {
              const handleAllocationChange = (value: AllocationMode) => {
                setAllocationMode(value);
                setValue(
                  "application_method.allocation",
                  value as ApplicationMethodAllocationValues,
                );
                field.onChange(value as ApplicationMethodAllocationValues);

                if (value === "once") {
                  setValue("application_method.max_quantity", 1);
                }
              };

              return (
                <Form.Item data-testid="promotion-create-form-allocation-item">
                  <Form.Label data-testid="promotion-create-form-allocation-label">
                    {t("promotions.fields.allocation")}
                  </Form.Label>

                  <Form.Control data-testid="promotion-create-form-allocation-control">
                    <RadioGroup
                      dir={direction}
                      className="flex gap-y-3"
                      value={allocationMode}
                      onValueChange={(val) =>
                        handleAllocationChange(val as AllocationMode)
                      }
                      data-testid="promotion-create-form-allocation-radio-group"
                    >
                      <RadioGroup.ChoiceBox
                        value="each"
                        label={t("promotions.form.allocation.each.title")}
                        description={t(
                          "promotions.form.allocation.each.description",
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-allocation-option-each"
                      />

                      <RadioGroup.ChoiceBox
                        value="once"
                        label={t("promotions.form.allocation.once.title")}
                        description={t(
                          "promotions.form.allocation.once.description",
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-allocation-option-once"
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="promotion-create-form-allocation-error" />
                </Form.Item>
              );
            }}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {!currentTemplate?.hiddenFields?.includes(
            "application_method.value",
          ) && (
            <Form.Field
              control={form.control}
              name="application_method.value"
              render={({ field: { onChange, value, ...field } }) => {
                const currencyCode =
                  form.getValues().application_method.currency_code;

                const currencyInfo =
                  currencies[currencyCode?.toUpperCase() || "USD"];

                return (
                  <Form.Item data-testid="promotion-create-form-value-item">
                    <Form.Label
                      tooltip={
                        currencyCode || !isFixedValueType
                          ? undefined
                          : t("promotions.fields.amount.tooltip")
                      }
                      data-testid="promotion-create-form-value-label"
                    >
                      {t("promotions.form.value.title")}
                    </Form.Label>

                    <Form.Control data-testid="promotion-create-form-value-control">
                      {isFixedValueType ? (
                        <CurrencyInput
                          {...field}
                          min={0}
                          code={currencyCode || "USD"}
                          onValueChange={(_value, _name, values) =>
                            onChange(values?.value)
                          }
                          decimalScale={currencyInfo?.decimal_digits ?? 2}
                          decimalsLimit={currencyInfo?.decimal_digits ?? 2}
                          symbol={
                            currencyCode ? getCurrencySymbol(currencyCode) : "$"
                          }
                          value={value}
                          disabled={!currencyCode}
                          data-testid="promotion-create-form-value-currency-input"
                        />
                      ) : (
                        <DeprecatedPercentageInput
                          key="amount"
                          className="text-right"
                          min={0}
                          max={100}
                          {...field}
                          value={value}
                          onChange={(e) => {
                            onChange(
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value),
                            );
                          }}
                          data-testid="promotion-create-form-value-percentage-input"
                        />
                      )}
                    </Form.Control>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                      data-testid="promotion-create-form-value-description"
                    >
                      <Trans
                        t={t}
                        i18nKey={
                          isFixedValueType
                            ? "promotions.form.value_type.fixed.description"
                            : "promotions.form.value_type.percentage.description"
                        }
                        components={[<br key="break" />]}
                      />
                    </Text>
                    <Form.ErrorMessage data-testid="promotion-create-form-value-error" />
                  </Form.Item>
                );
              }}
            />
          )}

          {(isTypeStandard || isTypeBuyGet) && allocationMode !== "across" && (
            <Form.Field
              control={form.control}
              name="application_method.max_quantity"
              render={() => {
                return (
                  <Form.Item data-testid="promotion-create-form-max-quantity-item">
                    <Form.Label data-testid="promotion-create-form-max-quantity-label">
                      {t("promotions.form.max_quantity.title")}
                    </Form.Label>

                    <Form.Control data-testid="promotion-create-form-max-quantity-control">
                      <Input
                        {...form.register("application_method.max_quantity", {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min={1}
                        placeholder="3"
                        data-testid="promotion-create-form-max-quantity-input"
                      />
                    </Form.Control>

                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                      data-testid="promotion-create-form-max-quantity-description"
                    >
                      <Trans
                        t={t}
                        i18nKey="promotions.form.max_quantity.description"
                        components={[<br key="break" />]}
                      />
                    </Text>
                    <Form.ErrorMessage data-testid="promotion-create-form-max-quantity-error" />
                  </Form.Item>
                );
              }}
            />
          )}
        </div>

        {isTypeBuyGet && (
          <>
            <Divider />
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col">
                <Heading
                  level="h2"
                  className="mb-2"
                  data-testid="promotion-create-form-store-offers-heading"
                >
                  {t("promotions.form.storeOffers.title")}
                </Heading>
                <Text
                  className="txt-small text-ui-fg-subtle"
                  data-testid="promotion-create-form-store-offers-description"
                >
                  {t("promotions.form.storeOffers.description")}
                </Text>
              </div>

              <Form.Field
                control={form.control}
                name="seller_id"
                render={({ field }) => {
                  return (
                    <Form.Item
                      className="basis-1/2"
                      data-testid="promotion-create-form-store-item"
                    >
                      <Form.Label data-testid="promotion-create-form-store-label">
                        {t("promotions.form.storeOffers.label")}
                      </Form.Label>

                      <Form.Control data-testid="promotion-create-form-store-control">
                        <Combobox
                          {...field}
                          value={field.value ?? ""}
                          options={stores.options}
                          searchValue={stores.searchValue}
                          onSearchValueChange={stores.onSearchValueChange}
                          fetchNextPage={stores.fetchNextPage}
                          placeholder={t(
                            "promotions.form.storeOffers.placeholder",
                          )}
                          data-testid="promotion-create-form-store-select"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="promotion-create-form-store-error" />
                    </Form.Item>
                  );
                }}
              />
            </div>
          </>
        )}

        {!isTypeStandard && (
          <>
            <Divider />
            <RulesFormField
              form={form}
              ruleType="buy-rules"
              scope="application_method.buy_rules"
            />
          </>
        )}

        {!isTargetTypeOrder && (
          <>
            <Divider />
            <RulesFormField
              form={form}
              ruleType="target-rules"
              scope="application_method.target_rules"
            />
          </>
        )}

        <Divider />

        <Form.Field
          control={form.control}
          name="limit"
          render={({ field: { onChange, value, ...field } }) => {
            return (
              <Form.Item
                className="basis-1/2"
                data-testid="promotion-create-form-limit-item"
              >
                <Form.Label
                  optional
                  data-testid="promotion-create-form-limit-label"
                >
                  {t("promotions.form.limit.title")}
                </Form.Label>
                <Form.Control data-testid="promotion-create-form-limit-control">
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    value={value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange(val === "" ? null : parseInt(val, 10));
                    }}
                    placeholder="100"
                    data-testid="promotion-create-form-limit-input"
                  />
                </Form.Control>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                  data-testid="promotion-create-form-limit-description"
                >
                  {t("promotions.form.limit.description")}
                </Text>
                <Form.ErrorMessage data-testid="promotion-create-form-limit-error" />
              </Form.Item>
            );
          }}
        />
      </div>
    </div>
  );
};

Root._tabMeta = defineTabMeta<CreatePromotionSchemaType>({
  id: "promotion",
  labelKey: "promotions.tabs.details",
  validationFields: [
    "is_automatic",
    "code",
    "type",
    "status",
    "rules",
    "is_tax_inclusive",
    "cost_bearer",
    "shared_marketplace_percentage",
    "limit",
    "application_method",
  ],
});

export const PromotionDetailsTab = Root;
