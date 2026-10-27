import { Text } from "@medusajs/ui"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"
import { Combobox } from "../../../../components/inputs/combobox"
import { getCountryByIso2 } from "../../../../lib/data/countries"
import { getProvinceOptions, type ZoneProvinces } from "../utils"

type ZoneGeoValues = {
  countries: string[]
  provinces: ZoneProvinces
}

export const ZoneProvincesField = ({ testId }: { testId: string }) => {
  const { t } = useTranslation()
  const { control } = useFormContext<ZoneGeoValues>()

  const countries = useWatch({ control, name: "countries" })

  const countriesWithProvinces = (countries ?? [])
    .map((code) => ({
      code,
      name: getCountryByIso2(code)?.display_name ?? code.toUpperCase(),
      options: getProvinceOptions(code),
    }))
    .filter((country) => country.options.length > 0)

  if (!countriesWithProvinces.length) {
    return null
  }

  return (
    <Form.Field
      control={control}
      name="provinces"
      render={({ field: { value, onChange } }) => (
        <Form.Item>
          <Form.Label optional>{t("shippingZones.fields.provinces")}</Form.Label>
          <Form.Hint>{t("shippingZones.fields.provincesHint")}</Form.Hint>
          <div className="bg-ui-bg-subtle shadow-elevation-card-rest divide-y rounded-lg">
            {countriesWithProvinces.map((country) => (
              <div
                key={country.code}
                className="grid grid-cols-1 items-center gap-2 px-4 py-3 md:grid-cols-[160px_1fr]"
              >
                <Text size="small" weight="plus" leading="compact">
                  {country.name}
                </Text>
                <Combobox
                  value={value?.[country.code] ?? []}
                  onChange={(selected) =>
                    onChange({ ...value, [country.code]: selected ?? [] })
                  }
                  options={country.options}
                  placeholder={t("shippingZones.fields.provincesPlaceholder")}
                  data-testid={`${testId}-provinces-combobox-${country.code}`}
                />
              </div>
            ))}
          </div>
          <Form.ErrorMessage />
        </Form.Item>
      )}
    />
  )
}
