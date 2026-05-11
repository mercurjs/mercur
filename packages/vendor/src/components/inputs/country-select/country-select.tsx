import {
  ComponentPropsWithoutRef,
  ComponentType,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { countries } from "../../../lib/data/countries";
import { Select } from "@medusajs/ui";

type CountrySelectProps = ComponentPropsWithoutRef<typeof Select> & {
  placeholder?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

const getDisplayNames = (language: string) => {
  try {
    return new Intl.DisplayNames([language], { type: "region" });
  } catch {
    return null;
  }
};

export const CountrySelect: ComponentType<CountrySelectProps> = forwardRef<
  HTMLButtonElement,
  CountrySelectProps
>(({ disabled, placeholder, defaultValue, onChange, ...field }, ref) => {
  const { t, i18n } = useTranslation();
  const innerRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => innerRef.current as HTMLButtonElement);

  const localizedCountries = useMemo(() => {
    const displayNames = getDisplayNames(i18n.language);
    const collator = new Intl.Collator(i18n.language, { sensitivity: "base" });

    return countries
      .map((country) => ({
        ...country,
        localized_name:
          displayNames?.of(country.iso_2.toUpperCase()) ?? country.display_name,
      }))
      .sort((a, b) => collator.compare(a.localized_name, b.localized_name));
  }, [i18n.language]);

  return (
    <div className="relative">
      <Select
        {...field}
        value={field.value ? field.value?.toLowerCase() : undefined}
        onValueChange={onChange}
        defaultValue={defaultValue ? defaultValue.toLowerCase() : undefined}
        disabled={disabled}
      >
        <Select.Trigger ref={innerRef} className="w-full">
          <Select.Value
            placeholder={placeholder || t("fields.selectCountry")}
          />
        </Select.Trigger>
        <Select.Content>
          {localizedCountries.map((country) => (
            <Select.Item
              key={country.iso_2}
              value={country.iso_2.toLowerCase()}
            >
              {country.localized_name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
});

CountrySelect.displayName = "CountrySelect";
