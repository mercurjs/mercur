import { i18n } from "@components/utilities/i18n"
import * as z from "zod"

export const RegisterSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z
      .string()
      .min(12)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t("register.passwordMismatch"),
    path: ["confirmPassword"],
  })
