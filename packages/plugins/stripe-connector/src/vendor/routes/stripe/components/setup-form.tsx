import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Container, Heading, Input, Select, Text, toast } from "@medusajs/ui"
import { Form, KeyboundForm, countries, useDocumentDirection } from "@mercurjs/dashboard-shared"
import { useForm } from "react-hook-form"
import * as zod from "zod"

import { useCreateMyAccount } from "../../../hooks/api/stripe"

const STRIPE_COUNTRIES = ["us", "gb", "de", "fr", "es", "it", "nl", "be", "pl", "se", "dk", "no", "fi", "ie", "at", "ch", "pt", "cz", "ca", "au"]

const COUNTRY_OPTIONS = countries
  .filter((country) => STRIPE_COUNTRIES.includes(country.iso_2))
  .sort((a, b) => a.display_name.localeCompare(b.display_name))

const SetupSchema = zod.object({
  country: zod.string().min(1, "Choose a country"),
  business_type: zod.enum(["individual", "company"]),
  business_name: zod.string().optional(),
  website: zod.union([zod.literal(""), zod.url("Enter a valid URL")]).optional(),
  support_email: zod.union([zod.literal(""), zod.email("Enter a valid email")]).optional(),
  support_phone: zod.string().optional(),
})

type SetupSchemaType = zod.infer<typeof SetupSchema>

const OPTIONAL_FIELDS = [
  { name: "business_name", label: "Business name", type: "text" },
  { name: "website", label: "Website", type: "url" },
  { name: "support_email", label: "Support email", type: "email" },
  { name: "support_phone", label: "Support phone", type: "tel" },
] as const

export const SetupForm = () => {
  const direction = useDocumentDirection()

  const form = useForm<SetupSchemaType>({
    defaultValues: {
      country: "",
      business_type: "individual",
      business_name: "",
      website: "",
      support_email: "",
      support_phone: "",
    },
    resolver: zodResolver(SetupSchema),
  })

  const { mutateAsync, isPending } = useCreateMyAccount()

  const handleSubmit = form.handleSubmit(async (values) => {
    const data = Object.fromEntries(Object.entries(values).filter(([, value]) => !!value))

    await mutateAsync(data, {
      onSuccess: () => toast.success("Account created", { description: "Continue on Stripe to finish onboarding." }),
      onError: (error) => toast.error(error.message),
    })
  })

  return (
    <Container className="divide-y p-0" data-testid="stripe-setup-form">
      <div className="px-6 py-4">
        <Heading data-testid="stripe-setup-heading">Set up payouts with Stripe</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Tell us where your business is registered. Stripe asks for the rest.
        </Text>
      </div>
      <Form {...form}>
        <KeyboundForm onSubmit={handleSubmit} className="divide-y">
          <div className="flex flex-col gap-y-4 px-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="country"
                render={({ field: { ref, onChange, ...field } }) => (
                  <Form.Item>
                    <Form.Label>Country</Form.Label>
                    <Form.Control>
                      <Select dir={direction} onValueChange={onChange} {...field}>
                        <Select.Trigger ref={ref} data-testid="stripe-setup-country">
                          <Select.Value placeholder="Choose a country" />
                        </Select.Trigger>
                        <Select.Content>
                          {COUNTRY_OPTIONS.map((country) => (
                            <Select.Item key={country.iso_2} value={country.iso_2.toUpperCase()}>
                              {country.display_name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="business_type"
                render={({ field: { ref, onChange, ...field } }) => (
                  <Form.Item>
                    <Form.Label>Business type</Form.Label>
                    <Form.Control>
                      <Select dir={direction} onValueChange={onChange} {...field}>
                        <Select.Trigger ref={ref} data-testid="stripe-setup-business-type">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="individual">Individual</Select.Item>
                          <Select.Item value="company">Company</Select.Item>
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {OPTIONAL_FIELDS.map(({ name, label, type }) => (
                <Form.Field
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label optional>{label}</Form.Label>
                      <Form.Control>
                        <Input
                          type={type}
                          autoComplete="off"
                          data-testid={`stripe-setup-${name.replace(/_/g, "-")}`}
                          {...field}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end px-6 py-4">
            <Button size="small" type="submit" isLoading={isPending} data-testid="stripe-setup-submit">
              Create Stripe account
            </Button>
          </div>
        </KeyboundForm>
      </Form>
    </Container>
  )
}
