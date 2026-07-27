import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { FieldValues, useForm, UseFormProps } from "react-hook-form"
import { z, ZodObject } from "zod"

import { useExtension } from "./context"
import {
  buildAdditionalDataDefaults,
  buildAdditionalDataSchema,
} from "./custom-fields-form"

type WithAdditionalData<T> = T & {
  additional_data?: Record<string, unknown>
}

export interface UseExtendableFormProps<
  TSchema extends ZodObject<Record<string, z.ZodTypeAny>>,
  TContext = unknown,
  TData = unknown
> extends Omit<
    UseFormProps<z.infer<TSchema>, TContext>,
    "resolver" | "defaultValues"
  > {
  /** Base schema for the built-in fields. */
  schema: TSchema
  /** Base default values for the built-in fields. */
  defaultValues: z.infer<TSchema>
  /** Custom-field model whose fields extend this form (e.g. `"product"`). */
  model: string
  /** Loaded entity, used to resolve custom-field default values. */
  data?: TData
  /**
   * Form zone (and optional tab) this form renders. When set, only custom
   * fields registered for that zone extend the schema/defaults — so a required
   * field defined for another zone (e.g. onboarding) doesn't block this form.
   * Omit to include every field for the model (legacy behaviour).
   */
  zone?: string
  tab?: string
}

/**
 * `useForm` that merges a model's registered custom fields into the base
 * schema and defaults under an `additional_data` key — mirrors Medusa's
 * `useExtendableForm`. Custom-field values live under `additional_data` so the
 * built-in validators never see them; the extension registry provides the
 * per-field zod validation and default values.
 */
export const useExtendableForm = <
  TSchema extends ZodObject<Record<string, z.ZodTypeAny>>,
  TContext = unknown,
  TTransformedValues extends FieldValues | undefined = undefined
>({
  schema: baseSchema,
  defaultValues: baseDefaultValues,
  model,
  data,
  zone,
  tab,
  ...props
}: UseExtendableFormProps<TSchema, TContext>) => {
  const extension = useExtension()

  const schema = useMemo(() => {
    const additionalData = buildAdditionalDataSchema(extension, model, zone, tab)
      .partial()
      .optional()

    // `.extend` is ZodObject-only; a refined base schema needs intersection.
    return typeof (baseSchema as ZodObject<Record<string, z.ZodTypeAny>>)
      .extend === "function"
      ? baseSchema.extend({ additional_data: additionalData })
      : (baseSchema.and(z.object({ additional_data: additionalData })) as unknown as typeof baseSchema)
  }, [baseSchema, extension, model, zone, tab])

  const defaultValues = useMemo(
    () => ({
      ...baseDefaultValues,
      additional_data: buildAdditionalDataDefaults(
        extension,
        model,
        data,
        zone,
        tab
      ),
    }),
    [baseDefaultValues, extension, model, data, zone, tab]
  )

  return useForm<
    WithAdditionalData<z.infer<TSchema>>,
    TContext,
    TTransformedValues
  >({
    ...props,
    defaultValues: defaultValues as UseFormProps<
      WithAdditionalData<z.infer<TSchema>>,
      TContext
    >["defaultValues"],
    resolver: zodResolver(schema) as UseFormProps<
      WithAdditionalData<z.infer<TSchema>>,
      TContext
    >["resolver"],
  })
}
