import { z } from 'zod';

export const registerFormSchema = z.object({
  firstName: z
    .string()
    .nonempty('Please enter first name')
    .max(50, 'First name must contain up to 50 characters'),
  lastName: z
    .string()
    .nonempty('Please enter last name')
    .max(50, 'Last name must contain up to 50 characters'),
  email: z
    .string()
    .nonempty('Please enter email')
    .email('Invalid email')
    .max(60, 'Email must contain up to 60 characters'),
  password: z
    .string()
    .nonempty('Please enter password')
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
      message:
        'Password must contain at least one uppercase letter, one number and one special character'
    })
    .max(64, 'Password must contain up to 64 characters'),
  phone: z
    .string()
    .min(6, 'Please enter phone number')
    .regex(/^\+?\d+$/, { message: 'Mobile phone must contain digits only' })
    .max(20, 'Phone number must contain up to 20 characters')
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;
