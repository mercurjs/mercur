import {
  Input,
  FormLabel,
  Form,
  FormField,
  FormItem,
  Text,
  FormControl,
  FormMessage,
  Button
} from '@/shared/ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateSeller } from '@/entities/seller'

const registerSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.'
  }),
  handle: z.string().min(4, {
    message: 'Handle must be at least 4 characters.'
  }),
  email: z.string().email({
    message: 'Email is invalid.'
  }),
  fullName: z.string().min(1, {
    message: 'Full name is required.'
  })
})

const LoginPage = () => {
  const { mutateAsync } = useCreateSeller()

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {}
  })

  function onSubmit({
    email,
    handle,
    name,
    fullName
  }: z.infer<typeof registerSchema>) {
    mutateAsync({
      handle,
      name,
      member: {
        email,
        name: fullName
      }
    })
  }

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="min-w-[360px]">
        <div>
          <Text weight="plus" size="xlarge" className="text-center">
            Create account
          </Text>
          <Text className="text-ui-fg-subtle text-center mt-2">
            To continue, please enter your details below.
          </Text>
        </div>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seller name</FormLabel>
                    <FormControl>
                      <Input placeholder="Seller name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
