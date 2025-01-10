import {
  Input,
  FormLabel,
  Form,
  FormField,
  FormItem,
  Typography,
  FormControl,
  FormMessage,
  Button
} from '@/shared/ui'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateSeller, useEmailpassRegister } from '@/shared/hooks/api'
import { Link, useLocation } from 'wouter'

const schema = z
  .object({
    email: z.string().email({
      message: 'Invalid email address.'
    }),
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters.'
    }),
    name: z.string().min(1, {
      message: 'Store name is required.'
    }),
    fullName: z.string().min(1, {
      message: 'Full name is required.'
    })
  })
  .strict()

const RegisterPage = () => {
  const { mutateAsync: createSeller } = useCreateSeller()
  const { mutateAsync: register } = useEmailpassRegister()
  const [, navigate] = useLocation()

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      fullName: '',
      email: '',
      password: ''
    }
  })

  async function onSubmit({
    name,
    fullName,
    email,
    password
  }: z.infer<typeof schema>) {
    const { token } = await register({
      email,
      password
    })

    await createSeller({
      name,
      member: {
        name: fullName
      },
      token
    })

    navigate('/login')
  }

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="min-w-[360px]">
        <div>
          <Typography weight="plus" size="xlarge" className="text-center">
            Create account
          </Typography>
          <Typography className="text-center mt-2">
            To continue, please enter your details below.
          </Typography>
        </div>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store name</FormLabel>
                      <FormControl>
                        <Input placeholder="Store name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-3">
                <Button type="submit" className="w-full">
                  Sign up
                </Button>
                <div className="text-center">
                  <Typography className="text-gray-600">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="text-primary hover:underline"
                    >
                      Login
                    </Link>
                  </Typography>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
