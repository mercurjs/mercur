import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Select, Textarea, toast } from "@medusajs/ui"
import {
  Form,
  KeyboundForm,
  RouteDrawer,
  currencies,
  useDocumentDirection,
  useRouteModal,
} from "@mercurjs/dashboard-shared"
import { useForm } from "react-hook-form"
import * as zod from "zod"

import { SellerCombobox } from "../../../../../components/seller-combobox"
import { useCreateAdjustment } from "../../../../../hooks/api/stripe"
import { ADJUSTMENT_TYPE_LABEL } from "../../../../../lib/status"
import { SettingsProviders } from "../../../../../providers/settings-providers"

const CreateAdjustmentSchema = zod.object({
  seller_id: zod.string().min(1, "Select a store"),
  type: zod.enum(["subscription", "extra_invoice", "extra_credit"]),
  amount: zod.string().refine((value) => Number(value) > 0, "Enter an amount greater than zero"),
  currency_code: zod.string().length(3, "Select a currency"),
  reason: zod.string().optional(),
})

type CreateAdjustmentSchemaType = zod.infer<typeof CreateAdjustmentSchema>

const TYPE_HINT: Record<CreateAdjustmentSchemaType["type"], string> = {
  subscription: "Charged to the store on its next settlement.",
  extra_invoice: "Charged to the store on its next settlement.",
  extra_credit: "Paid to the store on its next settlement.",
}

const CreateAdjustmentForm = () => {
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()

  const form = useForm<CreateAdjustmentSchemaType>({
    defaultValues: { seller_id: "", type: "subscription", amount: "", currency_code: "eur", reason: "" },
    resolver: zodResolver(CreateAdjustmentSchema),
  })

  const { mutateAsync, isPending } = useCreateAdjustment()
  const type = form.watch("type")

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        seller_id: data.seller_id,
        type: data.type,
        amount: Number(data.amount),
        currency_code: data.currency_code,
        reason: data.reason || null,
      },
      {
        onSuccess: () => {
          toast.success("Adjustment created")
          handleSuccess()
        },
        onError: (error) => toast.error(error.message),
      }
    )
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
                  <SellerCombobox {...field} data-testid="stripe-adjustment-store-input" />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="type"
            render={({ field: { ref, onChange, ...field } }) => (
              <Form.Item>
                <Form.Label>Type</Form.Label>
                <Form.Control>
                  <Select dir={direction} onValueChange={onChange} {...field}>
                    <Select.Trigger ref={ref} data-testid="stripe-adjustment-type-select">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {Object.entries(ADJUSTMENT_TYPE_LABEL).map(([value, label]) => (
                        <Select.Item key={value} value={value}>
                          {label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.Hint>{TYPE_HINT[type]}</Form.Hint>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Field
              control={form.control}
              name="amount"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Amount</Form.Label>
                  <Form.Control>
                    <Input type="number" min="0" step="0.01" data-testid="stripe-adjustment-amount-input" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="currency_code"
              render={({ field: { ref, onChange, ...field } }) => (
                <Form.Item>
                  <Form.Label>Currency</Form.Label>
                  <Form.Control>
                    <Select dir={direction} onValueChange={onChange} {...field}>
                      <Select.Trigger ref={ref} data-testid="stripe-adjustment-currency-select">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {Object.values(currencies).map((currency) => (
                          <Select.Item key={currency.code} value={currency.code.toLowerCase()}>
                            {currency.code} · {currency.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <Form.Field
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>Reason</Form.Label>
                <Form.Control>
                  <Textarea rows={3} data-testid="stripe-adjustment-reason-input" {...field} />
                </Form.Control>
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
            <Button size="small" type="submit" isLoading={isPending} data-testid="stripe-adjustment-save-button">
              Save
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

const CreateAdjustmentPage = () => (
  <SettingsProviders>
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>Create adjustment</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          Charge or credit a store on its next settlement.
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <CreateAdjustmentForm />
    </RouteDrawer>
  </SettingsProviders>
)

export default CreateAdjustmentPage
