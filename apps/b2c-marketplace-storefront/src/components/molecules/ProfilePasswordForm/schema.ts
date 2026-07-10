import { z } from "zod"

export const profilePasswordSchema = z.object({
  newPassword: z.string().nonempty(""),
  confirmPassword: z.string().nonempty("Please enter new password"),
})

export type ProfilePasswordFormData = z.infer<typeof profilePasswordSchema>
