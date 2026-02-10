import {
  ComponentPropsWithoutRef,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react"
import { useTranslation } from "react-i18next"
import { countries } from "../../../lib/data/countries"
import { Select } from "@medusajs/ui"

export const CountrySelect = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Select> & {
    placeholder?: string
    defaultValue?: string
    onChange?: (value: string) => void
    "data-testid"?: string
  }
>(({ disabled, placeholder, defaultValue, onChange, "data-testid": dataTestId, ...field }, ref) => {
  const { t } = useTranslation()
  const innerRef = useRef<HTMLButtonElement>(null)

  useImperativeHandle(ref, () => innerRef.current as HTMLButtonElement)
  
  return (
    <div className="relative" data-testid={dataTestId ? `${dataTestId}-container` : undefined}>
      <Select
        {...field}
        value={field.value ? field.value?.toLowerCase() : undefined}
        onValueChange={onChange}
        defaultValue={defaultValue ? defaultValue.toLowerCase() : undefined}
        disabled={disabled}
        data-testid={dataTestId}
      >
        <Select.Trigger ref={innerRef} className="w-full" data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}>
          <Select.Value
            placeholder={placeholder || t("fields.selectCountry")}
            data-testid={dataTestId ? `${dataTestId}-value` : undefined}
          />
        </Select.Trigger>
        <Select.Content data-testid={dataTestId ? `${dataTestId}-content` : undefined}>
          {countries.map((country) => (
            <Select.Item
              key={country.iso_2}
              value={country.iso_2.toLowerCase()}
              data-testid={dataTestId ? `${dataTestId}-option-${country.iso_2.toLowerCase()}` : undefined}
            >
              {country.display_name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  )
})

CountrySelect.displayName = "CountrySelect"
