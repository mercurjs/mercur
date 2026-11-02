import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Checkbox, Heading, Input, Text, Textarea, toast } from "@medusajs/ui"
import { Form, KeyboundForm, RouteDrawer, useRouteModal } from "@mercurjs/dashboard-shared"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as zod from "zod"

import { useCreateMagentoWebhook } from "../../../../hooks/api/magento"
import { SettingsProviders } from "../../../../providers/settings-providers"

const EVENT_GROUPS: { label: string; events: string[] }[] = [
  { label: "Offers", events: ["offer.created", "offer.updated", "offer.deleted"] },
  {
    label: "Sellers",
    events: [
      "seller.updated",
      "seller.approved",
      "seller.suspended",
      "seller.unsuspended",
      "seller.terminated",
      "seller.unterminated",
    ],
  },
  { label: "Products", events: ["product.published", "product.rejected"] },
  {
    label: "Orders",
    events: [
      "order_group.created",
      "order.updated",
      "order.canceled",
      "order.fulfillment_created",
      "order.fulfillment_canceled",
      "shipment.created",
      "delivery.created",
    ],
  },
  {
    label: "Returns and refunds",
    events: [
      "order.return_requested",
      "order.return_received",
      "order.refund_requested",
      "order.refund_recorded",
    ],
  },
]

const ALL_EVENTS = EVENT_GROUPS.flatMap((group) => group.events)

const CreateMagentoWebhookSchema = zod.object({
  url: zod.string().url("Enter a full URL including https://"),
  description: zod.string().optional(),
  events: zod.array(zod.string()).min(1, "Pick at least one event"),
})

type CreateMagentoWebhookSchemaType = zod.infer<typeof CreateMagentoWebhookSchema>

const CreateMagentoWebhookForm = () => {
  const { handleSuccess } = useRouteModal()
  const [secret, setSecret] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const form = useForm<CreateMagentoWebhookSchemaType>({
    defaultValues: { url: "", description: "", events: ALL_EVENTS },
    resolver: zodResolver(CreateMagentoWebhookSchema),
  })

  const { mutateAsync, isPending } = useCreateMagentoWebhook({
    onSuccess: ({ webhook }) => {
      setSecret(webhook.secret)
      setCreatedId(webhook.id)
    },
    onError: (e) => toast.error(e.message),
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync({
      url: data.url,
      events: data.events,
      description: data.description || null,
    })
  })

  if (secret && createdId) {
    return (
      <>
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <div>
              <Heading level="h2">Signing secret</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Paste this into the Magento connector configuration. It is shown only once.
              </Text>
            </div>
            <Input readOnly value={secret} data-testid="magento-webhook-secret-input" />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(secret).then(() => toast.success("Copied"))}
            >
              Copy
            </Button>
            <Button size="small" onClick={() => handleSuccess(`/settings/magento/${createdId}`)}>
              Done
            </Button>
          </div>
        </RouteDrawer.Footer>
      </>
    )
  }

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-6 overflow-y-auto">
          <Form.Field
            control={form.control}
            name="url"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Endpoint URL</Form.Label>
                <Form.Control>
                  <Input
                    placeholder="https://shop.example.com/mercur/webhook"
                    autoComplete="off"
                    data-testid="magento-webhook-url-input"
                    {...field}
                  />
                </Form.Control>
                <Form.Hint>The route the Magento connector exposes for Mercur events.</Form.Hint>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>Description</Form.Label>
                <Form.Control>
                  <Textarea rows={2} data-testid="magento-webhook-description-input" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="events"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Events</Form.Label>
                <div className="flex flex-col gap-y-4">
                  {EVENT_GROUPS.map((group) => (
                    <div key={group.label} className="flex flex-col gap-y-2">
                      <Text size="small" weight="plus">
                        {group.label}
                      </Text>
                      {group.events.map((event) => {
                        const checked = field.value.includes(event)
                        return (
                          <label key={event} className="flex items-center gap-x-2">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) =>
                                field.onChange(
                                  next === true
                                    ? [...field.value, event]
                                    : field.value.filter((e) => e !== event)
                                )
                              }
                              data-testid={`magento-webhook-event-${event}`}
                            />
                            <Text size="small" leading="compact">
                              {event}
                            </Text>
                          </label>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                Cancel
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="magento-webhook-save-button">
              Create
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

const CreateMagentoWebhookPage = () => (
  <SettingsProviders>
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>Add webhook endpoint</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          Register a Magento endpoint that receives Mercur events.
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <CreateMagentoWebhookForm />
    </RouteDrawer>
  </SettingsProviders>
)

export default CreateMagentoWebhookPage
