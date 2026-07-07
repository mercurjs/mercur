import { type Control } from "react-hook-form"
import { Input, Switch, Textarea } from "@medusajs/ui"
import type { CustomFormField } from "@mercurjs/dashboard-sdk"
import { Form } from "../components/common/form"
import { useExtension } from "./context"

function zodType(field: CustomFormField): string {
  const def = (field.validation as unknown as { def?: { type?: string } })?.def
  return def?.type ?? "string"
}

type FieldProps = {
  name: string
  field: CustomFormField
  control: Control<any>
  data?: unknown
}

const ExtensionField = ({ name, field, control }: FieldProps) => {
  const type = zodType(field)
  const Component = field.component

  return (
    <Form.Field
      control={control}
      name={`additional_data.${name}`}
      render={({ field: rhf }) => (
        <Form.Item>
          <Form.Label>{field.label ?? name}</Form.Label>
          {field.description && <Form.Hint>{field.description}</Form.Hint>}
          <Form.Control>
            {Component ? (
              <Component />
            ) : type === "boolean" ? (
              <Switch
                checked={!!rhf.value}
                onCheckedChange={rhf.onChange}
              />
            ) : type === "number" ? (
              <Input
                type="number"
                placeholder={field.placeholder}
                {...rhf}
                value={(rhf.value as string) ?? ""}
              />
            ) : type === "string" ? (
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

export type FormExtensionZoneProps = {
  model: string
  zone: string
  tab?: string
  control: Control<any>
  data?: unknown
}

/**
 * Renders a model's custom form fields for a given zone/tab under the
 * `additional_data.<field>` RHF namespace (Medusa's convention), through the
 * mandated `Form.Field → Form.Item` primitive chain.
 */
export const FormExtensionZone = ({
  model,
  zone,
  tab,
  control,
  data,
}: FormExtensionZoneProps) => {
  const fields = useExtension().getFormFields(model, zone, tab)
  if (fields.length === 0) return null

  return (
    <>
      {fields.map(({ name, field }) => (
        <ExtensionField
          key={name}
          name={name}
          field={field}
          control={control}
          data={data}
        />
      ))}
    </>
  )
}
