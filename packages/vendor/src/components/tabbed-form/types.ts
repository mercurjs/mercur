import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"

export interface TabDefinition<T extends FieldValues = FieldValues> {
  id: string
  labelKey: string
  label?: string
  validationFields?: FieldPath<T>[]
  isVisible?: (form: UseFormReturn<T>) => boolean
}
