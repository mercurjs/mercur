import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Button, Heading, Input, toast } from "@medusajs/ui"
import { useFieldArray, useForm } from "react-hook-form"

import { Form } from "@components/common/form"
import { SwitchBox } from "@components/common/switch-box"
import { HandleInput } from "@components/inputs/handle-input"
import {
  RouteFocusModal,
  useRouteModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useCreateOrderShipment } from "@hooks/api"
import {
  ExtendedAdminOrder,
  ExtendedAdminOrderFulfillment,
} from "@custom-types/order"
import { CreateShipmentSchema } from "./constants"

type OrderCreateFulfillmentFormProps = {
  order: ExtendedAdminOrder
  fulfillment: ExtendedAdminOrderFulfillment
}

export function OrderCreateShipmentForm({
  order,
  fulfillment,
}: OrderCreateFulfillmentFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { mutateAsync: createShipment, isPending: isMutating } =
    useCreateOrderShipment(order.id, fulfillment?.id)

  const form = useForm<zod.infer<typeof CreateShipmentSchema>>({
    defaultValues: {
      labels: [{ tracking_number: "", tracking_url: "" }],
      notify: false,
    },
    resolver: zodResolver(CreateShipmentSchema),
  })

  const { fields: labels, append } = useFieldArray({
    name: "labels",
    control: form.control,
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await createShipment(
      {
        items:
          fulfillment?.items
            ?.map((i) => ({ id: i?.line_item_id, quantity: i.quantity }))
            .filter((item) => !!item.id) ?? [],
        labels: data.labels
          .filter((l) => !!l.tracking_number)
          .map((l) => ({
            tracking_number: l.tracking_number,
            tracking_url: l.tracking_url ?? "",
            label_url: "",
          })),
      },
      {
        onSuccess: () => {
          toast.success(t("orders.shipment.toastCreated"))
          handleSuccess(`/orders/${order.id}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col items-center overflow-y-auto p-16">
          <div className="flex w-full max-w-[736px] flex-col gap-8">
            <div className="flex items-center justify-between">
              <Heading>{t("orders.shipment.title")}</Heading>
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() =>
                  append({
                    tracking_number: "",
                    tracking_url: "",
                  })
                }
                data-testid="shipment-add-tracking"
              >
                {t("orders.shipment.addTracking")}
              </Button>
            </div>

            <div className="flex flex-col gap-8 divide-y divide-dashed">
              {labels.map((label, index) => (
                <div
                  key={label.id}
                  className="flex flex-col gap-y-4 [&:not(:first-child)]:pt-8"
                >
                  <Form.Field
                    control={form.control}
                    name={`labels.${index}.tracking_url`}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label optional>
                          {t("orders.shipment.trackingUrl")}
                        </Form.Label>
                        <Form.Control>
                          <HandleInput
                            {...field}
                            value={field.value ?? ""}
                            prefix="/"
                            placeholder={t(
                              "orders.shipment.trackingUrlPlaceholder"
                            )}
                            data-testid={`shipment-tracking-url-${index}`}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name={`labels.${index}.tracking_number`}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label optional>
                          {t("orders.shipment.trackingNumber")}
                        </Form.Label>
                        <Form.Control>
                          <Input
                            {...field}
                            data-testid={`shipment-tracking-number-${index}`}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
              ))}

              <div className="pt-8">
                <SwitchBox
                  control={form.control}
                  name="notify"
                  label={t("orders.shipment.sendNotification")}
                  description={t("orders.shipment.sendNotificationHint")}
                />
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isMutating}
              data-testid="shipment-confirm"
            >
              {t("actions.confirm")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
