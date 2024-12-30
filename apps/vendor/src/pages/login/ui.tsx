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
import { useCreateSession, useEmailpassLogin } from '@/shared/hooks/api'
import { Link, useLocation } from 'wouter'
import { toast } from 'sonner'

const schema = z
  .object({
    email: z.string().email({
      message: 'Invalid email address.'
    }),
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters.'
    })
  })
  .strict()

const LoginPage = () => {
  const { mutateAsync: login } = useEmailpassLogin()
  const { mutateAsync: createSession } = useCreateSession()
  const [, navigate] = useLocation()

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  async function onSubmit({ email, password }: z.infer<typeof schema>) {
    const { token } = await login(
      {
        email,
        password
      },
      {
        onError: (error) => {
          toast.error('Error occurred while logging in', {
            description: error.message
          })
        }
      }
    )

    await createSession(
      { token },
      {
        onError: () => {
          toast.error('Error occurred while logging in', {
            description: 'Please try again later'
          })
        }
      }
    )

    navigate('/dashboard/orders')
  }

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="min-w-[360px]">
        <div>
          <Typography weight="plus" size="xlarge" className="text-center">
            Sign in
          </Typography>
          <Typography className="text-center mt-2">
            Welcome back! Please enter your details.
          </Typography>
        </div>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col space-y-3">
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
                        <Input
                          type="password"
                          placeholder="Your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <Typography className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Create new one
              </Link>
            </Typography>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
