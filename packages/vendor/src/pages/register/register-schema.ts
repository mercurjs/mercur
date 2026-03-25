import { i18n } from "@components/utilities/i18n"
import * as z from "zod"

export const RegisterSchema = z
  .object({
    email: z.string().email(i18n.t("register.validation.emailInvalid")),
    password: z.string().min(8, i18n.t("register.validation.passwordMinLength")),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t("register.passwordMismatch"),
    path: ["confirmPassword"],
  })
