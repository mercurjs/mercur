import { type ReactNode } from "react"
import { type Control, type FieldValues } from "react-hook-form"
import { Input, Select, Switch, Textarea } from "@medusajs/ui"
import type { CustomFormField } from "@mercurjs/dashboard-sdk"
import { Form } from "../components/common/form"
import { useExtension } from "./context"
import { resolveFormFieldType } from "./custom-fields-form"

type FieldProps = {
  name: string
  path: string
  field: CustomFormField
  control: Control<FieldValues>
  data?: unknown
}

const ExtensionField = ({ name, path, field, control, data }: FieldProps) => {
  const type = resolveFormFieldType(field)
  const Component = field.component

  return (
    <Form.Field
      control={control}
      name={path}
      render={({ field: rhf }) => (
        <Form.Item>
          <Form.Label>{field.label ?? name}</Form.Label>
          {field.description && <Form.Hint>{field.description}</Form.Hint>}
          <Form.Control>
            {Component ? (
              <Component field={rhf} data={data} />
            ) : type === "boolean" ? (
              <Switch
                checked={!!rhf.value}
                onCheckedChange={rhf.onChange}
              />
            ) : type === "select" ? (
              <Select
                value={(rhf.value as string) ?? ""}
                onValueChange={rhf.onChange}
              >
                <Select.Trigger ref={rhf.ref}>
                  <Select.Value placeholder={field.placeholder} />
                </Select.Trigger>
                <Select.Content>
                  {(field.options ?? []).map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            ) : type === "number" ? (
              <Input
                type="number"
                placeholder={field.placeholder}
                {...rhf}
                value={(rhf.value as string) ?? ""}
              />
            ) : type === "text" ? (
              <Input
                placeholder={field.placeholder}
                {...rhf}
                value={(rhf.value as string) ?? ""}
              />
            ) : (
              <Textarea
                placeholder={field.placeholder}
                {...rhf}
                value={(rhf.value as string) ?? ""}
              />
            )}
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Item>
      )}
    />
  )
}

// RHF's `Control` is invariant in its field values, so hosts' typed controls
// are taken generically and widened once here.
type AnyControl<TFieldValues extends FieldValues, TContext, TTransformed> =
  Control<TFieldValues, TContext, TTransformed>

const widen = <TFieldValues extends FieldValues, TContext, TTransformed>(
  control: AnyControl<TFieldValues, TContext, TTransformed>
) => control as unknown as Control<FieldValues>

export type FormExtensionZoneProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
  TTransformed = TFieldValues,
> = {
  model: string
  zone: string
  tab?: string
  control: AnyControl<TFieldValues, TContext, TTransformed>
  data?: unknown
  /** The form's own field ids; config entries for them are overrides. */
  builtInFieldIds?: string[]
  /**
   * Render only fields aimed at `tab`. A tabbed form sets it on every tab but
   * the first, so untabbed fields render once.
   */
  exactTab?: boolean
}

/**
 * Renders a model's custom form fields for a given zone/tab under the
 * `additional_data.<field>` RHF namespace (Medusa's convention), through the
 * mandated `Form.Field → Form.Item` primitive chain.
 */
export const FormExtensionZone = <
  TFieldValues extends FieldValues,
  TContext,
  TTransformed,
>({
  model,
  zone,
  tab,
  control,
  data,
  builtInFieldIds,
  exactTab,
}: FormExtensionZoneProps<TFieldValues, TContext, TTransformed>) => {
  const fields = useExtension().getFormFields(
    model,
    zone,
    tab,
    builtInFieldIds,
    exactTab
  )
  if (fields.length === 0) return null

  return (
    <div className="flex flex-col gap-y-4">
      {fields.map(({ name, field }) => (
        <ExtensionField
          key={name}
          name={name}
          path={`additional_data.${name}`}
          field={field}
          control={widen(control)}
          data={data}
        />
      ))}
    </div>
  )
}

export type ExtendableFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
  TTransformed = TFieldValues,
> = {
  model: string
  zone: string
  tab?: string
  /** The built-in field's form key, which is also its override id. */
  id: string
  control: AnyControl<TFieldValues, TContext, TTransformed>
  data?: unknown
  children: ReactNode
}

/**
 * Wraps one of a form's own fields so `forms[].fields[id]` can replace it (the
 * replacement binds to the same form key; validation stays the base schema's)
 * or remove it (`null`, the field keeps its default value).
 */
export const ExtendableFormField = <
  TFieldValues extends FieldValues,
  TContext,
  TTransformed,
>({
  model,
  zone,
  tab,
  id,
  control,
  data,
  children,
}: ExtendableFormFieldProps<TFieldValues, TContext, TTransformed>) => {
  const { overridden, field } = useExtension().getFormFieldOverride(
    model,
    zone,
    id,
    tab
  )

  if (!overridden) return <>{children}</>
  if (!field) return null

  return (
    <ExtensionField
      name={id}
      path={id}
      field={field}
      control={widen(control)}
      data={data}
    />
  )
}
