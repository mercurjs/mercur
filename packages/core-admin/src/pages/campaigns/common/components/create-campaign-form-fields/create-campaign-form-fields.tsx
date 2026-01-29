import {
  CurrencyInput,
  DatePicker,
  Heading,
  Input,
  RadioGroup,
  Select,
  Text,
  Textarea,
} from "@medusajs/ui"
import { useEffect } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { useStore } from "../../../../../hooks/api/store"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import {
  currencies,
  getCurrencySymbol,
} from "../../../../../lib/data/currencies"
import { Combobox } from "../../../../../components/inputs/combobox"

export const CreateCampaignFormFields = ({ form, fieldScope = "" }) => {
  const { t } = useTranslation()
  const { store } = useStore()
  const direction = useDocumentDirection()
  const watchValueType = useWatch({
    control: form.control,
    name: `${fieldScope}budget.type`,
  })

  const isTypeSpend = watchValueType === "spend"

  const currencyValue = useWatch({
    control: form.control,
    name: `${fieldScope}budget.currency_code`,
  })

  const promotionCurrencyValue = useWatch({
    control: form.control,
    name: `application_method.currency_code`,
  })

  const currency = currencyValue || promotionCurrencyValue

  useEffect(() => {
    form.setValue(`${fieldScope}budget.limit`, null)

    if (isTypeSpend) {
      form.setValue(`campaign.budget.currency_code`, promotionCurrencyValue)
    } else {
      form.setValue(`campaign.budget.currency_code`, null)
    }
  }, [promotionCurrencyValue, isTypeSpend])

  if (promotionCurrencyValue) {
    const formCampaignBudget = form.getValues().campaign?.budget
    const formCampaignCurrency = formCampaignBudget?.currency_code

    if (
      formCampaignBudget?.type === "spend" &&
      formCampaignCurrency !== promotionCurrencyValue
    ) {
      form.setValue("campaign.budget.currency_code", promotionCurrencyValue)
    }
  }

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-y-8" data-testid="campaign-create-form-fields">
      <div data-testid="campaign-create-form-fields-header">
        <Heading data-testid="campaign-create-form-fields-heading">{t("campaigns.create.header")}</Heading>

        <Text size="small" className="text-ui-fg-subtle" data-testid="campaign-create-form-fields-hint">
          {t("campaigns.create.hint")}
        </Text>
      </div>

      <div className="flex flex-col gap-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name={`${fieldScope}name`}
            render={({ field }) => {
              return (
                <Form.Item data-testid="campaign-create-form-fields-name-item">
                  <Form.Label data-testid="campaign-create-form-fields-name-label">{t("fields.name")}</Form.Label>

                  <Form.Control data-testid="campaign-create-form-fields-name-control">
                    <Input {...field} data-testid="campaign-create-form-fields-name-input" />
                  </Form.Control>

                  <Form.ErrorMessage data-testid="campaign-create-form-fields-name-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name={`${fieldScope}campaign_identifier`}
            render={({ field }) => {
              return (
                <Form.Item data-testid="campaign-create-form-fields-identifier-item">
                  <Form.Label data-testid="campaign-create-form-fields-identifier-label">{t("campaigns.fields.identifier")}</Form.Label>

                  <Form.Control data-testid="campaign-create-form-fields-identifier-control">
                    <Input {...field} data-testid="campaign-create-form-fields-identifier-input" />
                  </Form.Control>

                  <Form.ErrorMessage data-testid="campaign-create-form-fields-identifier-error" />
                </Form.Item>
              )
            }}
          />
        </div>

        <Form.Field
          control={form.control}
          name={`${fieldScope}description`}
          render={({ field }) => {
            return (
              <Form.Item data-testid="campaign-create-form-fields-description-item">
                <Form.Label optional data-testid="campaign-create-form-fields-description-label">{t("fields.description")}</Form.Label>

                <Form.Control data-testid="campaign-create-form-fields-description-control">
                  <Textarea {...field} data-testid="campaign-create-form-fields-description-input" />
                </Form.Control>

                <Form.ErrorMessage data-testid="campaign-create-form-fields-description-error" />
              </Form.Item>
            )
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Field
          control={form.control}
          name={`${fieldScope}starts_at`}
          render={({ field }) => {
            return (
              <Form.Item data-testid="campaign-create-form-fields-starts-at-item">
                <Form.Label optional data-testid="campaign-create-form-fields-starts-at-label">
                  {t("campaigns.fields.start_date")}
                </Form.Label>

                <Form.Control data-testid="campaign-create-form-fields-starts-at-control">
                  <DatePicker
                    granularity="minute"
                    shouldCloseOnSelect={false}
                    {...field}
                    data-testid="campaign-create-form-fields-starts-at-input"
                  />
                </Form.Control>

                <Form.ErrorMessage data-testid="campaign-create-form-fields-starts-at-error" />
              </Form.Item>
            )
          }}
        />

        <Form.Field
          control={form.control}
          name={`${fieldScope}ends_at`}
          render={({ field }) => {
            return (
              <Form.Item data-testid="campaign-create-form-fields-ends-at-item">
                <Form.Label optional data-testid="campaign-create-form-fields-ends-at-label">
                  {t("campaigns.fields.end_date")}
                </Form.Label>

                <Form.Control data-testid="campaign-create-form-fields-ends-at-control">
                  <DatePicker
                    granularity="minute"
                    shouldCloseOnSelect={false}
                    {...field}
                    data-testid="campaign-create-form-fields-ends-at-input"
                  />
                </Form.Control>

                <Form.ErrorMessage data-testid="campaign-create-form-fields-ends-at-error" />
              </Form.Item>
            )
          }}
        />
      </div>

      <div data-testid="campaign-create-form-fields-budget-header">
        <Heading data-testid="campaign-create-form-fields-budget-heading">{t("campaigns.budget.create.header")}</Heading>
        <Text size="small" className="text-ui-fg-subtle" data-testid="campaign-create-form-fields-budget-hint">
          {t("campaigns.budget.create.hint")}
        </Text>
      </div>

      <Form.Field
        control={form.control}
        name={`${fieldScope}budget.type`}
        render={({ field }) => {
          return (
            <Form.Item data-testid="campaign-create-form-fields-budget-type-item">
              <Form.Label
                tooltip={
                  fieldScope?.length && !currency
                    ? t("promotions.tooltips.campaignType")
                    : undefined
                }
                data-testid="campaign-create-form-fields-budget-type-label"
              >
                {t("campaigns.budget.fields.type")}
              </Form.Label>

              <Form.Control data-testid="campaign-create-form-fields-budget-type-control">
                <RadioGroup
                  dir={direction}
                  className="flex gap-x-4 gap-y-3"
                  {...field}
                  onValueChange={field.onChange}
                  data-testid="campaign-create-form-fields-budget-type-radio-group"
                >
                  <RadioGroup.ChoiceBox
                    className="flex-1"
                    value={"usage"}
                    label={t("campaigns.budget.type.usage.title")}
                    description={t("campaigns.budget.type.usage.description")}
                    data-testid="campaign-create-form-fields-budget-type-option-usage"
                  />

                  <RadioGroup.ChoiceBox
                    className="flex-1"
                    value={"spend"}
                    label={t("campaigns.budget.type.spend.title")}
                    description={t("campaigns.budget.type.spend.description")}
                    disabled={fieldScope?.length ? !currency : false}
                    data-testid="campaign-create-form-fields-budget-type-option-spend"
                  />
                </RadioGroup>
              </Form.Control>
              <Form.ErrorMessage data-testid="campaign-create-form-fields-budget-type-error" />
            </Form.Item>
          )
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isTypeSpend && (
          <Form.Field
            control={form.control}
            name={`${fieldScope}budget.currency_code`}
            render={({ field: { onChange, ref, ...field } }) => {
              return (
                <Form.Item data-testid="campaign-create-form-fields-budget-currency-item">
                  <Form.Label
                    tooltip={
                      fieldScope?.length && !currency
                        ? t("promotions.campaign_currency.tooltip")
                        : undefined
                    }
                    data-testid="campaign-create-form-fields-budget-currency-label"
                  >
                    {t("fields.currency")}
                  </Form.Label>
                  <Form.Control data-testid="campaign-create-form-fields-budget-currency-control">
                    <Select
                      dir={direction}
                      {...field}
                      onValueChange={onChange}
                      disabled={!!fieldScope.length}
                      data-testid="campaign-create-form-fields-budget-currency-select"
                    >
                      <Select.Trigger ref={ref} data-testid="campaign-create-form-fields-budget-currency-select-trigger">
                        <Select.Value />
                      </Select.Trigger>

                      <Select.Content data-testid="campaign-create-form-fields-budget-currency-select-content">
                        {Object.values(currencies)
                          .filter(
                            (currency) =>
                              !!store?.supported_currencies?.find(
                                (c) =>
                                  c.currency_code ===
                                  currency.code.toLocaleLowerCase()
                              )
                          )
                          .map((currency) => (
                            <Select.Item
                              value={currency.code.toLowerCase()}
                              key={currency.code}
                              data-testid={`campaign-create-form-fields-budget-currency-select-option-${currency.code.toLowerCase()}`}
                            >
                              {currency.name}
                            </Select.Item>
                          ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="campaign-create-form-fields-budget-currency-error" />
                </Form.Item>
              )
            }}
          />
        )}

        <Form.Field
          control={form.control}
          name={`${fieldScope}budget.limit`}
          render={({ field: { onChange, value, ...field } }) => {
            return (
              <Form.Item className="basis-1/2" data-testid="campaign-create-form-fields-budget-limit-item">
                <Form.Label
                  tooltip={
                    !currency && isTypeSpend
                      ? t("promotions.fields.amount.tooltip")
                      : undefined
                  }
                  data-testid="campaign-create-form-fields-budget-limit-label"
                >
                  {t("campaigns.budget.fields.limit")}
                </Form.Label>

                <Form.Control data-testid="campaign-create-form-fields-budget-limit-control">
                  {isTypeSpend ? (
                    <CurrencyInput
                      min={0}
                      onValueChange={(value) =>
                        onChange(value ? parseInt(value) : "")
                      }
                      code={currencyValue}
                      symbol={
                        currencyValue ? getCurrencySymbol(currencyValue) : ""
                      }
                      {...field}
                      value={value}
                      disabled={!currency && isTypeSpend}
                      data-testid="campaign-create-form-fields-budget-limit-currency-input"
                    />
                  ) : (
                    <Input
                      type="number"
                      key="usage"
                      {...field}
                      min={0}
                      value={value}
                      onChange={(e) => {
                        onChange(
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value)
                        )
                      }}
                      data-testid="campaign-create-form-fields-budget-limit-number-input"
                    />
                  )}
                </Form.Control>
                <Form.ErrorMessage data-testid="campaign-create-form-fields-budget-limit-error" />
              </Form.Item>
            )
          }}
        />

        {!isTypeSpend && (
          <Form.Field
            control={form.control}
            name={`${fieldScope}budget.attribute`}
            render={({ field }) => {
              return (
                <Form.Item className="basis-1/2" data-testid="campaign-create-form-fields-budget-attribute-item">
                  <Form.Label
                    tooltip={t(
                      "campaigns.budget.fields.budgetAttributeTooltip"
                    )}
                    data-testid="campaign-create-form-fields-budget-attribute-label"
                  >
                    {t("campaigns.budget.fields.budgetAttribute")}
                  </Form.Label>

                  <Form.Control data-testid="campaign-create-form-fields-budget-attribute-control">
                    <Combobox
                      key="attribute"
                      {...field}
                      onChange={(e) => {
                        if (typeof e === "undefined") {
                          field.onChange(null)
                        } else {
                          field.onChange(e)
                        }
                      }}
                      allowClear
                      options={[
                        {
                          label: t("fields.customer"),
                          value: "customer_id",
                        },
                        {
                          label: t("fields.email"),
                          value: "customer_email",
                        },
                        {
                          label: t("fields.promotionCode"),
                          value: "promotion_code",
                        },
                      ]}
                      data-testid="campaign-create-form-fields-budget-attribute-combobox"
                    ></Combobox>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="campaign-create-form-fields-budget-attribute-error" />
                </Form.Item>
              )
            }}
          />
        )}
      </div>
    </div>
  )
}
