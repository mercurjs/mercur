import { HttpTypes } from "@medusajs/types"
import { Button, Input, Select, Text, Textarea, toast } from "@medusajs/ui"
import { RouteDrawer, useRouteModal } from "@components/modals"

import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Form } from "@components/common/form"
import { KeyboundForm } from "@components/utilities/keybound-form"
import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"
import { useUpdateReservationItem } from "@hooks/api/reservations"

type EditReservationFormProps = {
  reservation: HttpTypes.AdminReservationResponse["reservation"]
  locations: HttpTypes.AdminStockLocation[]
  item: HttpTypes.AdminInventoryItemResponse["inventory_item"]
}

const EditReservationSchema = z.object({
  location_id: z.string(),
  description: z.string().optional(),
  quantity: z.number().nullable(),
})

const AttributeGridRow = ({
  title,
  value,
}: {
  title: string
  value: string | number
}) => {
  return (
    <div className="grid grid-cols-2 divide-x">
      <Text className="px-2 py-1.5" size="small" leading="compact">
        {title}
      </Text>
      <Text className="px-2 py-1.5" size="small" leading="compact">
        {value}
      </Text>
    </div>
  )
}

const getDefaultValues = (
  reservation: HttpTypes.AdminReservationResponse["reservation"]
) => {
  return {
    quantity: reservation.quantity,
    location_id: reservation.location_id,
    description: reservation.description ?? undefined,
  }
}

export const EditReservationForm = ({
  reservation,
  item,
  locations = [],
}: EditReservationFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useExtendableForm({
    schema: EditReservationSchema,
    model: "reservation",
    zone: "edit",
    data: reservation,
    defaultValues: getDefaultValues(reservation),
  })

  const { mutateAsync } = useUpdateReservationItem(reservation.id)

  const reservedQuantity = form.watch("quantity")
  const locationId = form.watch("location_id")

  const level = item.location_levels!.find(
    (level: HttpTypes.AdminInventoryLevel) => level.location_id === locationId
  )

  // The reservation's own quantity is already counted in the level's reserved
  // amount, so it is available to this edit — add it back to the ceiling.
  const maxQuantity =
    (level?.available_quantity ?? 0) + (reservation.quantity ?? 0)

  const handleSubmit = form.handleSubmit(async (values) => {
    // A location with no available stock wins over the empty-field message,
    // matching the Figma error states.
    if (maxQuantity < 1) {
      form.setError("quantity", {
        type: "manual",
        message: t("inventory.reservation.errors.noAvaliableQuantity"),
      })
      return
    }

    if (values.quantity === null || values.quantity === undefined) {
      form.setError("quantity", {
        type: "manual",
        message: t("inventory.reservation.errors.pleaseEnterQuantity"),
      })
      return
    }

    if (values.quantity < 1 || values.quantity > maxQuantity) {
      form.setError("quantity", {
        type: "manual",
        message: t("inventory.reservation.errors.quantityOutOfRange", {
          max: maxQuantity,
        }),
      })
      return
    }

    const { additional_data: _additionalData, ...payload } = values as z.infer<
      typeof EditReservationSchema
    > & { additional_data?: Record<string, unknown> }

    mutateAsync(
      { ...payload, quantity: values.quantity },
      {
        onSuccess: () => {
          toast.success(t("inventory.reservation.updateSuccessToast"))
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-auto">
          <Form.Field
            control={form.control}
            name="location_id"
            render={({ field: { onChange, value, ref, ...field } }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("inventory.reservation.location")}</Form.Label>
                  <Form.Control>
                    <Select
                      value={value}
                      onValueChange={(v) => {
                        onChange(v)
                      }}
                      {...field}
                    >
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {(locations || []).map((r) => (
                          <Select.Item key={r.id} value={r.id}>
                            {r.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <div className="text-ui-fg-subtle shadow-elevation-card-rest grid grid-rows-4 divide-y rounded-lg border">
            <AttributeGridRow
              title={t("fields.title")}
              value={item.title ?? item.sku!}
            />
            <AttributeGridRow title={t("fields.sku")} value={item.sku!} />
            <AttributeGridRow
              title={t("fields.inStock")}
              value={level!.stocked_quantity}
            />
            <AttributeGridRow
              title={t("inventory.available")}
              value={
                level!.stocked_quantity -
                (level!.reserved_quantity - reservation.quantity) -
                (reservedQuantity ?? 0)
              }
            />
          </div>
          <Form.Field
            control={form.control}
            name="quantity"
            render={({ field: { onChange, value, ...field } }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t("inventory.reservation.reserved")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      type="number"
                      min={0}
                      max={maxQuantity}
                      value={value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value

                        if (value === "") {
                          onChange(null)
                        } else {
                          onChange(parseFloat(value))
                        }
                      }}
                      {...field}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label optional>{t("fields.description")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <FormExtensionZone
            model="reservation"
            zone="edit"
            control={form.control}
            data={reservation}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={false}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
