import { InlineTip, Input, Switch } from "@medusajs/ui"
import { ComponentType } from "react"
import { ControllerRenderProps, FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Form } from "../../../components/common/form"
import { FormField } from "../../types"
import { FormFieldType } from "./types"
import { getFieldType } from "./utils"

type FormExtensionZoneProps<TFieldValues extends FieldValues = FieldValues> = {
  fields: FormField[]
  form: UseFormReturn<TFieldValues>
}

export const FormExtensionZone = <TFieldValues extends FieldValues = FieldValues>({ 
  fields, 
  form 
}: FormExtensionZoneProps<TFieldValues>) => {
  return (
    <div>
      {fields.map((field, index) => (
        <FormExtensionField key={index} field={field} form={form} />
      ))}
    </div>
  )
}

function getFieldLabel(field: FormField) {
  if (field.label) {
    return field.label
  }

  return field.name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

type FormExtensionFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  field: FormField
  form: UseFormReturn<TFieldValues>
}

const FormExtensionField = <TFieldValues extends FieldValues = FieldValues>({ 
  field, 
  form 
}: FormExtensionFieldProps<TFieldValues>) => {
  const label = getFieldLabel(field)
  const description = field.description
  const placeholder = field.placeholder
  const Component = field.Component

  const type = getFieldType(field.validation)

  const { control } = form

  return (
    <Form.Field
      control={control}
      name={`additional_data.${field.name}` as FieldPath<TFieldValues>}
      render={({ field }) => {
        return (
          <Form.Item>
            <Form.Label>{label}</Form.Label>
            {description && <Form.Hint>{description}</Form.Hint>}
            <Form.Control>
              <FormExtensionFieldComponent
                field={field}
                type={type}
                component={Component}
                placeholder={placeholder}
              />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )
      }}
    />
  )
}

type FormExtensionFieldComponentProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  field: ControllerRenderProps<TFieldValues, TName>
  type: FormFieldType
  component?: ComponentType<ControllerRenderProps<TFieldValues, TName> & { placeholder?: string }>
  placeholder?: string
}

const FormExtensionFieldComponent = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  field,
  type,
  component,
  placeholder,
}: FormExtensionFieldComponentProps<TFieldValues, TName>) => {
  const { t } = useTranslation()

  if (component) {
    const Component = component

    return <Component {...field} placeholder={placeholder} />
  }

  switch (type) {
    case "text": {
      return <Input {...field} placeholder={placeholder} />
    }
    case "number": {
      return <Input {...field} placeholder={placeholder} type="number" />
    }
    case "boolean": {
      return <Switch {...field} />
    }
    default: {
      return (
        <InlineTip variant="warning" label={t("general.warning")}>
          The field type does not support rendering a fallback component. Please
          provide a component prop.
        </InlineTip>
      )
    }
  }
}
