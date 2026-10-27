import type { TFunction } from "i18next"
import { z } from "zod"

const CUTOFF_TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export const cutoffTimeSchema = (t: TFunction) =>
  z
    .string()
    .refine((value) => value === "" || CUTOFF_TIME_REGEX.test(value), {
      message: t("shippingMethods.fields.cutoffTimeInvalid"),
    })

export const toCutoffTimePayload = (value: string) => value || null
