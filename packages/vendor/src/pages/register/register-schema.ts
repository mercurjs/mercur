import * as z from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, { message: "Name should be a string" }),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string()
    .min(12, { message: "at least 12 characters" })
    .regex(/[a-z]/, { message: "at least one lowercase case" })
    .regex(/[A-Z]/, { message: "at least one upper case" })
    .regex(/[0-9]/, { message: "at least one digit" })
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/, { message: "at least one special character" }),
  confirmPassword: z.string()
})  .refine((data) => data.password === data.confirmPassword, {
  message: "passwords don't match",
  path: ['confirmPassword'],
});