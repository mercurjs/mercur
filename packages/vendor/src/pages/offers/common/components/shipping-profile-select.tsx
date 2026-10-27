import { ComponentPropsWithoutRef, forwardRef } from "react"
import { XMarkMini } from "@medusajs/icons"
import { IconButton, Select } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useDocumentDirection } from "../../../../hooks/use-document-direction"

type ShippingProfileOption = { id: string; name?: string | null }

type ShippingProfileSelectProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "value" | "onChange" | "onBlur" | "name" | "disabled"
> & {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  disabled?: boolean
  profiles: ShippingProfileOption[]
  "data-testid"?: string
}

export const ShippingProfileSelect = forwardRef<
  HTMLButtonElement,
  ShippingProfileSelectProps
>(
  (
    {
      value,
      onChange,
      onBlur,
      name,
      disabled,
      profiles,
      "data-testid": testId = "offer-shipping-profile-select",
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation()
    const direction = useDocumentDirection()

    return (
      <div className="flex items-center gap-x-2">
        <Select
          name={name}
          value={value}
          onValueChange={onChange}
          dir={direction}
          disabled={disabled}
        >
          <Select.Trigger
            {...rest}
            ref={ref}
            onBlur={onBlur}
            data-testid={testId}
          >
            <Select.Value
              placeholder={t("offers.fields.shippingProfileDefault")}
            />
          </Select.Trigger>
          <Select.Content>
            {profiles.map((p) => (
              <Select.Item key={p.id} value={p.id}>
                {p.name ?? ""}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        {value && !disabled && (
          <IconButton
            type="button"
            size="small"
            variant="transparent"
            aria-label={t("actions.clear")}
            onClick={() => onChange("")}
            data-testid={`${testId}-clear`}
          >
            <XMarkMini />
          </IconButton>
        )}
      </div>
    )
  }
)

ShippingProfileSelect.displayName = "ShippingProfileSelect"

export const toShippingProfilePayload = (
  value: string,
  initial: string | null | undefined
): { shipping_profile_id?: string | null } => {
  if (value === (initial ?? "")) {
    return {}
  }

  return { shipping_profile_id: value || null }
}
