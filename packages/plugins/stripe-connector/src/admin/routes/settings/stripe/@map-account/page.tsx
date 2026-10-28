import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, toast } from "@medusajs/ui"
import { Form, KeyboundForm, RouteDrawer, useRouteModal } from "@mercurjs/dashboard-shared"
import { useForm } from "react-hook-form"
import * as zod from "zod"

import { SellerCombobox } from "../../../../components/seller-combobox"
import { useMapStripeAccount } from "../../../../hooks/api/stripe"
import { SettingsProviders } from "../../../../providers/settings-providers"

const MapAccountSchema = zod.object({
  seller_id: zod.string().min(1, "Select a store"),
  external_id: zod.string().regex(/^acct_\w+$/, "Enter a Stripe account ID, e.g. acct_1Nv0FGQ9RKHgCVdK"),
})

type MapAccountSchemaType = zod.infer<typeof MapAccountSchema>

const MapAccountForm = () => {
  const { handleSuccess } = useRouteModal()

  const form = useForm<MapAccountSchemaType>({
    defaultValues: { seller_id: "", external_id: "" },
    resolver: zodResolver(MapAccountSchema),
  })

  const { mutateAsync, isPending } = useMapStripeAccount()

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ payout_account }) => {
        toast.success("Account mapped")
        handleSuccess(`/payout-accounts/${payout_account.id}`)
      },
      onError: (error) => toast.error(error.message),
    })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-y-auto">
          <Form.Field
            control={form.control}
            name="seller_id"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Store</Form.Label>
                <Form.Control>
                  <SellerCombobox {...field} data-testid="stripe-map-account-store-input" />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="external_id"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Stripe account ID</Form.Label>
                <Form.Control>
                  <Input placeholder="acct_..." autoComplete="off" data-testid="stripe-map-account-id-input" {...field} />
                </Form.Control>
                <Form.Hint>A connected account that already exists in your Stripe platform.</Form.Hint>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="stripe-map-account-cancel-button">
                Cancel
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="stripe-map-account-save-button">
              Save
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

const MapAccountPage = () => (
  <SettingsProviders>
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading data-testid="stripe-map-account-heading">Map existing account</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          Attach a connected account that already exists in Stripe to a store.
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <MapAccountForm />
    </RouteDrawer>
  </SettingsProviders>
)

export default MapAccountPage
