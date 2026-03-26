import { i18n } from "@components/utilities/i18n"
import * as z from "zod"

export const RegisterSchema = z
  .object({
    email: z.string().email(i18n.t("register.validation.emailInvalid")),
    password: z
      .string()
      .min(1)
      .refine((val) => val.trim().length > 0),
    confirmPassword: z.string().min(1),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("register.passwordMismatch"),
        path: ["confirmPassword"],
      })
    }
  })
