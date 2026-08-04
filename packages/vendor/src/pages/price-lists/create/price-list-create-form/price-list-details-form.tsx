import {
  DatePicker,
  Divider,
  Heading,
  Input,
  RadioGroup,
  Text,
  Textarea,
} from "@medusajs/ui"
import { type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { PriceListCustomerAvailabilitySelector } from "@pages/price-lists/common/components/price-list-customer-availability-selector"
import type { PricingCreateSchemaType } from "./schema"

type PriceListDetailsFormProps = {
  form: UseFormReturn<PricingCreateSchemaType>
}

export const PriceListDetailsForm = ({ form }: PriceListDetailsFormProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16">
        <div>
          <Heading>{t("priceLists.create.header")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("priceLists.create.subheader")}
          </Text>
        </div>
        <Form.Field
          control={form.control}
          name="type"
          render={({ field: { onChange, ...rest } }) => {
            return (
              <Form.Item>
                <div className="flex flex-col gap-y-4">
                  <div>
                    <Form.Label>{t("priceLists.fields.type.label")}</Form.Label>
                    <Form.Hint>{t("priceLists.fields.type.hint")}</Form.Hint>
                  </div>
                  <Form.Control>
                    <RadioGroup
                      onValueChange={onChange}
                      {...rest}
                      className="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                      <RadioGroup.ChoiceBox
                        value={"sale"}
                        label={t("priceLists.fields.type.options.sale.label")}
                        description={t(
                          "priceLists.fields.type.options.sale.description"
                        )}
                      />
                      <RadioGroup.ChoiceBox
                        value={"override"}
                        label={t(
                          "priceLists.fields.type.options.override.label"
                        )}
                        description={t(
                          "priceLists.fields.type.options.override.description"
                        )}
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage />
                </div>
              </Form.Item>
            )
          }}
        />
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="status"
            render={({ field: { onChange, ...rest } }) => (
              <Form.Item>
                <Form.Label>{t("priceLists.fields.status.label")}</Form.Label>
                <Form.Control>
                  <RadioGroup
                    onValueChange={onChange}
                    {...rest}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  >
                    <RadioGroup.ChoiceBox
                      value="draft"
                      label={t("priceLists.fields.status.options.draft")}
                      description={t(
                        "priceLists.fields.status.descriptions.draft"
                      )}
                    />
                    <RadioGroup.ChoiceBox
                      value="active"
                      label={t("priceLists.fields.status.options.active")}
                      description={t(
                        "priceLists.fields.status.descriptions.active"
                      )}
                    />
                  </RadioGroup>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.title")}</Form.Label>
                <Form.Control>
                  <Input {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.description")}</Form.Label>
                <Form.Control>
                  <Textarea {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
        <Divider />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="starts_at"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("priceLists.fields.startsAt.label")}
                </Form.Label>
                <Form.Control>
                  <DatePicker
                    granularity="minute"
                    shouldCloseOnSelect={false}
                    {...field}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="ends_at"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("priceLists.fields.endsAt.label")}
                </Form.Label>
                <Form.Control>
                  <DatePicker
                    granularity="minute"
                    shouldCloseOnSelect={false}
                    {...field}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
        <Divider />
        <Form.Field
          control={form.control}
          name="rules.customer_group_id"
          render={() => (
            <Form.Item>
              <div>
                <Form.Label optional>
                  {t("priceLists.fields.customerAvailability.label")}
                </Form.Label>
                <Form.Hint>
                  {t("priceLists.fields.customerAvailability.hint")}
                </Form.Hint>
              </div>
              <Form.Control>
                <PriceListCustomerAvailabilitySelector
                  control={form.control}
                  name="rules.customer_group_id"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      </div>
    </div>
  )
}
