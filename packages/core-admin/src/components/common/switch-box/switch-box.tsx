import { Switch } from "@medusajs/ui"
import { ReactNode } from "react"
import { ControllerProps, FieldPath, FieldValues } from "react-hook-form"

import { Form } from "../../common/form"

interface HeadlessControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, "render"> {}

interface SwitchBoxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends HeadlessControllerProps<TFieldValues, TName> {
  label: string
  description: string
  optional?: boolean
  tooltip?: ReactNode
  /**
   * Callback for performing additional actions when the checked state changes.
   * This does not intercept the form control, it is only used for injecting side-effects.
   */
  onCheckedChange?: (checked: boolean) => void
  "data-testid"?: string
}

/**
 * Wrapper for the Switch component to be used with `react-hook-form`.
 *
 * Use this component whenever a design calls for wrapping the Switch component
 * in a container with a label and description.
 */
export const SwitchBox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  optional = false,
  tooltip,
  onCheckedChange,
  "data-testid": dataTestId,
  ...props
}: SwitchBoxProps<TFieldValues, TName>) => {
  return (
    <Form.Field
      {...props}
      render={({ field: { value, onChange, ...field } }) => {
        return (
          <Form.Item data-testid={dataTestId ? `${dataTestId}-item` : undefined}>
            <div className="bg-ui-bg-component shadow-elevation-card-rest flex items-start gap-x-3 rounded-lg p-3" data-testid={dataTestId ? `${dataTestId}-container` : undefined}>
              <Form.Control data-testid={dataTestId ? `${dataTestId}-control` : undefined}>
                <Switch
                  className="rtl:rotate-180"
                  dir="ltr"
                  {...field}
                  checked={value}
                  onCheckedChange={(e) => {
                    onCheckedChange?.(e)
                    onChange(e)
                  }}
                  data-testid={dataTestId ? `${dataTestId}-switch` : undefined}
                />
              </Form.Control>
              <div data-testid={dataTestId ? `${dataTestId}-label-container` : undefined}>
                <Form.Label optional={optional} tooltip={tooltip} data-testid={dataTestId ? `${dataTestId}-label` : undefined}>
                  {label}
                </Form.Label>
                <Form.Hint data-testid={dataTestId ? `${dataTestId}-hint` : undefined}>{description}</Form.Hint>
              </div>
            </div>
            <Form.ErrorMessage data-testid={dataTestId ? `${dataTestId}-error` : undefined} />
          </Form.Item>
        )
      }}
    />
  )
}
