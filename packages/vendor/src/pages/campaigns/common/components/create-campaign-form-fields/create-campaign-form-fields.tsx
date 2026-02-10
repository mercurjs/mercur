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
import { Path, PathValue, UseFormReturn, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { useStore } from "@hooks/api/store"
import {
  currencies,
  getCurrencySymbol,
} from "@lib/data/currencies"
import { CampaignFormFields, WithNestedCampaign } from "@custom-types/campaign"


type CreateCampaignFormFieldsProps<T extends CampaignFormFields | WithNestedCampaign> = {
  form: UseFormReturn<T>
  fieldScope?: string
}

export const CreateCampaignFormFields = <T extends CampaignFormFields | WithNestedCampaign>({ 
  form, 
  fieldScope = ""
}: CreateCampaignFormFieldsProps<T>) => {
  
  const { t } = useTranslation()
  const { store } = useStore()

  const watchValueType = useWatch({
    control: form.control,
    name: `${fieldScope}budget.type` as Path<T>,
  })

  const isTypeSpend = watchValueType === "spend"

  const currencyValue = useWatch({
    control: form.control,
    name: `${fieldScope}budget.currency_code` as Path<T>,
  })

  const promotionCurrencyValue = useWatch({
    control: form.control,
    name: `application_method.currency_code` as Path<T>,
  })

  const currency = currencyValue || promotionCurrencyValue

  useEffect(() => {
    form.resetField(`${fieldScope}budget.limit` as Path<T>)

    if (fieldScope) {
      const currencyPath = `campaign.budget.currency_code` as Path<T>
      
      if (isTypeSpend && promotionCurrencyValue) {
        const currencyValue = promotionCurrencyValue as PathValue<T, typeof currencyPath>
        form.setValue(currencyPath, currencyValue)
      } else if (watchValueType === "usage") {
        const nullValue = null as PathValue<T, typeof currencyPath>
        form.setValue(currencyPath, nullValue)
      }
    }
  }, [watchValueType, fieldScope, form, isTypeSpend, promotionCurrencyValue])

  if (promotionCurrencyValue && fieldScope) {
    const formValues = form.getValues()
    const budget = (formValues as WithNestedCampaign)?.campaign?.budget

    if (
      budget?.type === "spend" &&
      budget?.currency_code !== promotionCurrencyValue
    ) {
      const currencyPath = "campaign.budget.currency_code" as Path<T>
      form.setValue(currencyPath, promotionCurrencyValue)
    }
  }

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-y-8">
      <div>
        <Heading>{t("campaigns.create.header")}</Heading>

        <Text size="small" className="text-ui-fg-subtle">
          {t("campaigns.create.hint")}
        </Text>
      </div>

      <div className="flex flex-col gap-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name={`${fieldScope}name` as Path<T>}
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("fields.name")}</Form.Label>

                  <Form.Control>
                    <Input {...field} value={(field.value as string) ?? ""} />
                  </Form.Control>

                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name={`${fieldScope}campaign_identifier` as Path<T>}
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("campaigns.fields.identifier")}</Form.Label>

                  <Form.Control>
                    <Input {...field} value={(field.value as string) ?? ""} />
                  </Form.Control>

                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
        </div>

        <Form.Field
          control={form.control}
          name={`${fieldScope}description` as Path<T>}
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label optional>{t("fields.description")}</Form.Label>

                <Form.Control>
                  <Textarea {...field} value={(field.value as string) ?? ""} />
                </Form.Control>

                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Field
          control={form.control}
          name={`${fieldScope}starts_at` as Path<T>}
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label optional>
                  {t("campaigns.fields.start_date")}
                </Form.Label>

                <Form.Control>
                  <DatePicker
                    granularity="minute"
                    shouldCloseOnSelect={false}
                    {...field}
                    value={field.value as Date | null | undefined}
                  />
                </Form.Control>

                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />

        <Form.Field
          control={form.control}
          name={`${fieldScope}ends_at` as Path<T>}
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label optional>
                  {t("campaigns.fields.end_date")}
                </Form.Label>

                <Form.Control>
                  <DatePicker
                    granularity="minute"
                    shouldCloseOnSelect={false}
                    {...field}
                    value={field.value as Date | null | undefined}
                  />
                </Form.Control>

                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
      </div>

      <div>
        <Heading>{t("campaigns.budget.create.header")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t("campaigns.budget.create.hint")}
        </Text>
      </div>

      <Form.Field
        control={form.control}
        name={`${fieldScope}budget.type` as Path<T>}
        render={({ field }) => {
          return (
            <Form.Item>
              <Form.Label
                tooltip={
                  fieldScope?.length && !currency
                    ? t("promotions.tooltips.campaignType")
                    : undefined
                }
              >
                {t("campaigns.budget.fields.type")}
              </Form.Label>

              <Form.Control>
                <RadioGroup
                  className="flex gap-y-3"
                  {...field}
                  value={field.value as string}
                  onValueChange={field.onChange}
                >
                  <RadioGroup.ChoiceBox
                    value={"usage"}
                    label={t("campaigns.budget.type.usage.title")}
                    description={t("campaigns.budget.type.usage.description")}
                  />

                  <RadioGroup.ChoiceBox
                    value={"spend"}
                    label={t("campaigns.budget.type.spend.title")}
                    description={t("campaigns.budget.type.spend.description")}
                    disabled={fieldScope?.length ? !currency : false}
                  />
                </RadioGroup>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isTypeSpend && (
          <Form.Field
            control={form.control}
            name={`${fieldScope}budget.currency_code` as Path<T>}
            render={({ field: { onChange, ref, ...field } }) => {
              return (
                <Form.Item>
                  <Form.Label
                    tooltip={
                      fieldScope?.length && !currency
                        ? t("promotions.campaign_currency.tooltip")
                        : undefined
                    }
                  >
                    {t("fields.currency")}
                  </Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      value={field.value as string}
                      onValueChange={onChange}
                      disabled={!!fieldScope?.length}
                    >
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>

                      <Select.Content>
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
                            >
                              {currency.name}
                            </Select.Item>
                          ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
        )}

        <Form.Field
          control={form.control}
          name={`${fieldScope}budget.limit` as Path<T>}
          render={({ field: { onChange, value, ...field } }) => {
            return (
              <Form.Item className="basis-1/2">
                <Form.Label
                  tooltip={
                    !currency && isTypeSpend
                      ? t("promotions.fields.amount.tooltip")
                      : undefined
                  }
                >
                  {t("campaigns.budget.fields.limit")}
                </Form.Label>

                <Form.Control>
                  {isTypeSpend ? (
                    <CurrencyInput
                      min={0}
                      onValueChange={(value) =>
                        onChange(value ? parseInt(value) : "")
                      }
                      code={currencyValue as string}
                      symbol={
                        currencyValue ? getCurrencySymbol(currencyValue as string) : ""
                      }
                      {...field}
                      value={value as string | number | undefined}
                      disabled={!currency && isTypeSpend}
                    />
                  ) : (
                    <Input
                      type="number"
                      key="usage"
                      {...field}
                      min={0}
                      value={value as string | number | undefined ?? ""}
                      onChange={(e) => {
                        onChange(
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value)
                        )
                      }}
                    />
                  )}
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
