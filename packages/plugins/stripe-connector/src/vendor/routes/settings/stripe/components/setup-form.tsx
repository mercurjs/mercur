import { Button, Container, Heading, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { useState } from "react"

import { useCreateMyAccount } from "../../../../hooks/api/stripe"

const COUNTRIES = ["US", "GB", "DE", "FR", "ES", "IT", "NL", "BE", "PL", "SE", "DK", "NO", "FI", "IE", "AT", "CH", "PT", "CZ", "CA", "AU"]

export const SetupForm = () => {
  const [form, setForm] = useState({ country: "", business_type: "individual", business_name: "", website: "", support_email: "", support_phone: "" })
  const create = useCreateMyAccount()

  return (
    <Container className="divide-y p-0" data-testid="stripe-setup-form">
      <div className="px-6 py-4">
        <Heading>Set up payouts with Stripe</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Tell us where your business is registered. Stripe then asks for the rest on its own secure page.
        </Text>
      </div>
      <div className="flex flex-col gap-y-4 px-6 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="stripe-country">Country</Label>
            <Select value={form.country} onValueChange={(country) => setForm({ ...form, country })}>
              <Select.Trigger id="stripe-country" data-testid="stripe-setup-country">
                <Select.Value placeholder="Choose a country" />
              </Select.Trigger>
              <Select.Content>
                {COUNTRIES.map((code) => (
                  <Select.Item key={code} value={code}>
                    {code}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="stripe-business-type">Business type</Label>
            <Select value={form.business_type} onValueChange={(business_type) => setForm({ ...form, business_type })}>
              <Select.Trigger id="stripe-business-type">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="individual">Individual</Select.Item>
                <Select.Item value="company">Company</Select.Item>
              </Select.Content>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(
            [
              ["business_name", "Business name", "text"],
              ["website", "Website", "url"],
              ["support_email", "Support email", "email"],
              ["support_phone", "Support phone", "tel"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key} className="flex flex-col gap-y-2">
              <Label htmlFor={`stripe-${key}`}>{label} (optional)</Label>
              <Input id={`stripe-${key}`} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end px-6 py-4">
        <Button
          size="small"
          isLoading={create.isPending}
          disabled={!form.country}
          data-testid="stripe-setup-submit"
          onClick={() =>
            create.mutate(form, {
              onSuccess: () => toast.success("Account created", { description: "Continue on Stripe to finish onboarding." }),
              onError: (e) => toast.error(e.message),
            })
          }
        >
          Create Stripe account
        </Button>
      </div>
    </Container>
  )
}
