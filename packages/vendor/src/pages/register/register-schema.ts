import { i18n } from "@components/utilities/i18n"
import * as z from "zod"

export const RegisterSchema = z.object({
  first_name: z.string().min(1, i18n.t("register.validation.firstNameRequired")),
  last_name: z.string().min(1, i18n.t("register.validation.lastNameRequired")),
  email: z.string().email(i18n.t("register.validation.emailInvalid")),
  password: z
    .string()
    .min(8, i18n.t("register.validation.passwordMinLength"))
    .refine((val) => val.trim().length >= 8, {
      message: i18n.t("register.validation.passwordMinLength"),
    })
    .refine((val) => /[a-z]/.test(val) && /[A-Z]/.test(val) && /[\d\W]/.test(val), {
      message: i18n.t("register.validation.passwordComplexity"),
    }),
})
