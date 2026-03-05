import { useEffect, useState } from "react"

import type {
  ApplicationMethodAllocationValues,
} from "@medusajs/types"
import {
  Alert,
  Badge,
  clx,
  CurrencyInput,
  Divider,
  Heading,
  Input,
  RadioGroup,
  Switch,
  Text,
} from "@medusajs/ui"
import { useWatch } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { DeprecatedPercentageInput } from "../../../../../components/inputs/percentage-input"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { currencies, getCurrencySymbol } from "../../../../../lib/data/currencies"
import { RulesFormField } from "../../../common/edit-rules/components/rules-form-field"
import { CreatePromotionSchemaType } from "./form-schema"

type AllocationMode = "each" | "across" | "once"

type PromotionDetailsTabProps = {
  currentTemplate?: {
    id: string
    title: string
    hiddenFields: string[]
  }
}

const Root = ({ currentTemplate }: PromotionDetailsTabProps) => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const form = useTabbedForm<CreatePromotionSchemaType>()
  const { setValue } = form

  const [allocationMode, setAllocationMode] = useState<AllocationMode>("each")

  const watchValueType = useWatch({
    control: form.control,
    name: "application_method.type",
  })
  const isFixedValueType = watchValueType === "fixed"

  const watchAllocation = useWatch({
    control: form.control,
    name: "application_method.allocation",
  })

  useEffect(() => {
    if (watchAllocation) {
      setAllocationMode(watchAllocation as AllocationMode)
    }
  }, [watchAllocation])

  const watchType = useWatch({
    control: form.control,
    name: "type",
  })

  const isTypeStandard = watchType === "standard"
  const isTypeBuyGet = watchType === "buyget"

  const targetType = useWatch({
    control: form.control,
    name: "application_method.target_type",
  })

  const isTargetTypeOrder = targetType === "order"

  return (
    <div className="flex size-full flex-col items-center">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 py-16">
        <Heading
          level="h1"
          className="text-fg-base"
          data-testid="promotion-create-form-promotion-heading"
        >
          {t(`promotions.sections.details`)}

          {currentTemplate?.title && (
            <Badge
              className="ml-2 align-middle"
              color="grey"
              size="2xsmall"
              rounded="full"
              data-testid="promotion-create-form-promotion-template-badge"
            >
              {currentTemplate?.title}
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
                        "promotions.form.method.automatic.description"
                      )}
                      className={clx("basis-1/2")}
                      data-testid="promotion-create-form-method-option-automatic"
                    />
                  </RadioGroup>
                </Form.Control>
                <Form.ErrorMessage data-testid="promotion-create-form-method-error" />
              </Form.Item>
            )
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
                        "promotions.form.status.draft.description"
                      )}
                      className={clx("basis-1/2")}
                      data-testid="promotion-create-form-status-option-draft"
                    />

                    <RadioGroup.ChoiceBox
                      value="active"
                      label={t("promotions.form.status.active.title")}
                      description={t(
                        "promotions.form.status.active.description"
                      )}
                      className={clx("basis-1/2")}
                      data-testid="promotion-create-form-status-option-active"
                    />
                  </RadioGroup>
                </Form.Control>
                <Form.ErrorMessage data-testid="promotion-create-form-status-error" />
              </Form.Item>
            )
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
              )
            }}
          />
        </div>

        {!currentTemplate?.hiddenFields?.includes("is_tax_inclusive") && (
          <>
            <Divider />
            <div className="flex gap-x-2 gap-y-4">
              <Form.Field
                control={form.control}
                name="is_tax_inclusive"
                render={({ field: { onChange, value, ...field } }) => {
                  return (
                    <Form.Item
                      className="basis-full"
                      data-testid="promotion-create-form-tax-inclusive-item"
                    >
                      <div className="flex items-center justify-between">
                        <div className="block">
                          <Form.Label data-testid="promotion-create-form-tax-inclusive-label">
                            {t("promotions.form.taxInclusive.title")}
                          </Form.Label>
                          <Form.Hint
                            className="!mt-1"
                            data-testid="promotion-create-form-tax-inclusive-hint"
                          >
                            {t("promotions.form.taxInclusive.description")}
                          </Form.Hint>
                        </div>
                        <Form.Control
                          className="mr-2 self-center"
                          data-testid="promotion-create-form-tax-inclusive-control"
                        >
                          <Switch
                            dir="ltr"
                            className="mt-[2px] rtl:rotate-180"
                            checked={!!value}
                            onCheckedChange={onChange}
                            {...field}
                            data-testid="promotion-create-form-tax-inclusive-switch"
                          />
                        </Form.Control>
                      </div>
                      <Form.ErrorMessage data-testid="promotion-create-form-tax-inclusive-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </>
        )}

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
                          "promotions.form.type.standard.description"
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-type-option-standard"
                      />

                      <RadioGroup.ChoiceBox
                        value="buyget"
                        label={t("promotions.form.type.buyget.title")}
                        description={t(
                          "promotions.form.type.buyget.description"
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-type-option-buyget"
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="promotion-create-form-type-error" />
                </Form.Item>
              )
            }}
          />
        )}

        <Divider />

        <RulesFormField form={form} ruleType="rules" />

        {!currentTemplate?.hiddenFields?.includes("application_method.type") && (
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
                          label={t(
                            "promotions.form.value_type.fixed.title"
                          )}
                          description={t(
                            "promotions.form.value_type.fixed.description"
                          )}
                          className={clx("basis-1/2")}
                          data-testid="promotion-create-form-value-type-option-fixed"
                        />

                        <RadioGroup.ChoiceBox
                          value="percentage"
                          label={t(
                            "promotions.form.value_type.percentage.title"
                          )}
                          description={t(
                            "promotions.form.value_type.percentage.description"
                          )}
                          className={clx("basis-1/2")}
                          data-testid="promotion-create-form-value-type-option-percentage"
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="promotion-create-form-value-type-error" />
                  </Form.Item>
                )
              }}
            />
          </>
        )}

        {!currentTemplate?.hiddenFields?.includes(
          "application_method.value"
        ) && (
          <>
            <Divider />
            <Form.Field
              control={form.control}
              name="application_method.value"
              render={({ field: { onChange, value, ...field } }) => {
                const currencyCode =
                  form.getValues().application_method.currency_code

                const currencyInfo =
                  currencies[currencyCode?.toUpperCase() || "USD"]

                return (
                  <Form.Item
                    className="basis-1/2"
                    data-testid="promotion-create-form-value-item"
                  >
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
                            currencyCode
                              ? getCurrencySymbol(currencyCode)
                              : "$"
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
                                : parseFloat(e.target.value)
                            )
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
                )
              }}
            />
          </>
        )}

        {(isTypeStandard || isTypeBuyGet) && allocationMode !== "across" && (
          <>
            {isTypeBuyGet && (
              <>
                <Divider />
              </>
            )}
            <Form.Field
              control={form.control}
              name="application_method.max_quantity"
              render={() => {
                return (
                  <Form.Item
                    className="basis-1/2"
                    data-testid="promotion-create-form-max-quantity-item"
                  >
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
                )
              }}
            />
          </>
        )}

        {!currentTemplate?.hiddenFields?.includes(
          "application_method.allocation"
        ) && (
          <Form.Field
            control={form.control}
            name="application_method.allocation"
            render={({ field }) => {
              const handleAllocationChange = (value: AllocationMode) => {
                setAllocationMode(value)
                setValue(
                  "application_method.allocation",
                  value as ApplicationMethodAllocationValues
                )
                field.onChange(value as ApplicationMethodAllocationValues)

                if (value === "once") {
                  setValue("application_method.max_quantity", 1)
                }
              }

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
                          "promotions.form.allocation.each.description"
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-allocation-option-each"
                      />

                      <RadioGroup.ChoiceBox
                        value="once"
                        label={t("promotions.form.allocation.once.title", {
                          defaultValue: "Once",
                        })}
                        description={t(
                          "promotions.form.allocation.once.description",
                          {
                            defaultValue:
                              "Limit discount to max quantity",
                          }
                        )}
                        className={clx("basis-1/2")}
                        data-testid="promotion-create-form-allocation-option-once"
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="promotion-create-form-allocation-error" />
                </Form.Item>
              )
            }}
          />
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
      </div>
    </div>
  )
}

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
    "application_method",
  ],
})

export const PromotionDetailsTab = Root
