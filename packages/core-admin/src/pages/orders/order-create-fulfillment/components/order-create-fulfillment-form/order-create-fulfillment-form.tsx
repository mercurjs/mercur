import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { AdminOrder, HttpTypes } from "@medusajs/types"
import { Alert, Button, Select, Switch, toast } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"

import { OrderLineItemDTO } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateOrderFulfillment } from "../../../../../hooks/api/orders"
import { getFulfillableQuantity } from "../../../../../lib/order-item"
import { CreateFulfillmentSchema } from "./constants"
import { OrderCreateFulfillmentItem } from "./order-create-fulfillment-item"
import {
  useReservationItems,
  useShippingOptions,
} from "../../../../../hooks/api"
import { getReservationsLimitCount } from "../../../../../lib/orders"
import { sdk } from "../../../../../lib/client"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { Combobox } from "../../../../../components/inputs/combobox"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"

type OrderCreateFulfillmentFormProps = {
  order: AdminOrder
  requiresShipping: boolean
}

export function OrderCreateFulfillmentForm({
  order,
  requiresShipping,
}: OrderCreateFulfillmentFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()
  const { mutateAsync: createOrderFulfillment, isPending: isMutating } =
    useCreateOrderFulfillment(order.id)

  const { reservations } = useReservationItems({
    line_item_id: order.items.map((i) => i.id),
    limit: getReservationsLimitCount(order),
  })

  const stockLocations = useComboboxData({
    queryFn: (params) => sdk.admin.stockLocation.list(params),
    queryKey: ["stock_locations"],
    getOptions: (data) =>
      data.stock_locations.map((location) => ({
        label: location.name,
        value: location.id,
      })),
  })

  const [fulfillableItems, setFulfillableItems] = useState(() =>
    (order.items || []).filter(
      (item) =>
        item.requires_shipping === requiresShipping &&
        getFulfillableQuantity(item) > 0
    )
  )

  const form = useForm<zod.infer<typeof CreateFulfillmentSchema>>({
    defaultValues: {
      quantity: fulfillableItems.reduce(
        (acc, item) => {
          acc[item.id] = getFulfillableQuantity(item)
          return acc
        },
        {} as Record<string, number>
      ),
      send_notification: !order.no_notification,
    },
    resolver: zodResolver(CreateFulfillmentSchema),
  })

  const selectedLocationId = useWatch({
    name: "location_id",
    control: form.control,
  })

  const { shipping_options = [], isLoading: isShippingOptionsLoading } =
    useShippingOptions({
      stock_location_id: selectedLocationId,
      // is_return: false, // TODO: 500 when enabled
      fields: "+service_zone.fulfillment_set.location.id",
    })

  const shippingOptionId = useWatch({
    name: "shipping_option_id",
    control: form.control,
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    const selectedShippingOption = shipping_options.find(
      (o) => o.id === shippingOptionId
    )

    if (!selectedShippingOption) {
      form.setError("shipping_option_id", {
        type: "manual",
        message: t("orders.fulfillment.error.noShippingOption"),
      })
      return
    }

    if (!selectedLocationId) {
      form.setError("location_id", {
        type: "manual",
        message: t("orders.fulfillment.error.noLocation"),
      })
      return
    }

    let items = Object.entries(data.quantity)
      .map(([id, quantity]) => ({
        id,
        quantity,
      }))
      .filter(({ quantity }) => !!quantity)

    /**
     * If items require shipping fulfill only items with matching shipping profile.
     */
    if (requiresShipping) {
      const selectedShippingProfileId =
        selectedShippingOption?.shipping_profile_id

      const itemShippingProfileMap = order.items.reduce((acc, item) => {
        acc[item.id] = item.variant?.product?.shipping_profile?.id
        return acc
      }, {} as any)

      items = items.filter(
        ({ id }) => itemShippingProfileMap[id] === selectedShippingProfileId
      )
    }

    const payload: HttpTypes.AdminCreateOrderFulfillment = {
      location_id: selectedLocationId,
      shipping_option_id: shippingOptionId,
      no_notification: !data.send_notification,
      items,
    }

    try {
      await createOrderFulfillment(payload)

      toast.success(t("orders.fulfillment.toast.created"))
      handleSuccess(`/orders/${order.id}`)
    } catch (e) {
      toast.error(e.message)
    }
  })

  useEffect(() => {
    if (shipping_options?.length) {
      const initialShippingOptionId =
        order.shipping_methods?.[0]?.shipping_option_id

      if (initialShippingOptionId) {
        const shippingOption = shipping_options.find(
          (o) => o.id === initialShippingOptionId
        )

        if (shippingOption) {
          const locationId =
            shippingOption.service_zone.fulfillment_set.location.id

          form.setValue("location_id", locationId)
          form.setValue(
            "shipping_option_id",
            initialShippingOptionId || undefined
          )
        } // else -> TODO: what if original shipping option is deleted?
      }
    }
  }, [shipping_options])

  const fulfilledQuantityArray = (order.items || []).map(
    (item) =>
      item.requires_shipping === requiresShipping &&
      item.detail.fulfilled_quantity
  )

  useEffect(() => {
    const itemsToFulfill =
      order?.items?.filter(
        (item) =>
          item.requires_shipping === requiresShipping &&
          getFulfillableQuantity(item) > 0
      ) || []

    setFulfillableItems(itemsToFulfill)

    if (itemsToFulfill.length) {
      form.clearErrors("root")
    } else {
      form.setError("root", {
        type: "manual",
        message: t("orders.fulfillment.error.noItems"),
      })
    }

    const quantityMap = itemsToFulfill.reduce(
      (acc, item) => {
        acc[item.id] = getFulfillableQuantity(item as OrderLineItemDTO)
        return acc
      },
      {} as Record<string, number>
    )

    form.setValue("quantity", quantityMap)
  }, [...fulfilledQuantityArray, requiresShipping])

  const differentOptionSelected =
    shippingOptionId &&
    order.shipping_methods?.[0]?.shipping_option_id !== shippingOptionId

  return (
    <RouteFocusModal.Form form={form} data-testid="order-create-fulfillment-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
        data-testid="order-create-fulfillment-form"
      >
        <RouteFocusModal.Header data-testid="order-create-fulfillment-header" />

        <RouteFocusModal.Body className="flex h-full w-full flex-col items-center divide-y overflow-y-auto" data-testid="order-create-fulfillment-body">
          <div className="flex size-full flex-col items-center overflow-auto p-16" data-testid="order-create-fulfillment-form-content">
            <div className="flex w-full max-w-[736px] flex-col justify-center px-2 pb-2">
              <div className="flex flex-col divide-y divide-dashed">
                <div className="pb-8" data-testid="order-create-fulfillment-location-section">
                  <Form.Field
                    control={form.control}
                    name="location_id"
                    render={({ field: { ...field } }) => {
                      return (
                        <Form.Item data-testid="order-create-fulfillment-location-item">
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <div className="flex-1">
                              <Form.Label data-testid="order-create-fulfillment-location-label">{t("fields.location")}</Form.Label>
                              <Form.Hint data-testid="order-create-fulfillment-location-hint">
                                {t("orders.fulfillment.locationDescription")}
                              </Form.Hint>
                            </div>
                            <div className="flex-1">
                              <Form.Control data-testid="order-create-fulfillment-location-control">
                                <Combobox
                                  {...field}
                                  options={stockLocations.options}
                                  searchValue={stockLocations.searchValue}
                                  onSearchValueChange={
                                    stockLocations.onSearchValueChange
                                  }
                                  disabled={stockLocations.disabled}
                                  data-testid="order-create-fulfillment-location-combobox"
                                />
                              </Form.Control>
                            </div>
                          </div>
                          <Form.ErrorMessage data-testid="order-create-fulfillment-location-error" />
                        </Form.Item>
                      )
                    }}
                  />
                </div>

                <div className="py-8" data-testid="order-create-fulfillment-shipping-section">
                  <Form.Field
                    control={form.control}
                    name="shipping_option_id"
                    render={({ field: { onChange, ref, ...field } }) => {
                      return (
                        <Form.Item data-testid="order-create-fulfillment-shipping-item">
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <div className="flex-1">
                              <Form.Label data-testid="order-create-fulfillment-shipping-label">
                                {t("fields.shippingMethod")}
                              </Form.Label>
                              <Form.Hint data-testid="order-create-fulfillment-shipping-hint">
                                {t("orders.fulfillment.methodDescription")}
                              </Form.Hint>
                            </div>
                            <div className="flex-1">
                              <Form.Control data-testid="order-create-fulfillment-shipping-control">
                                <Select
                                  dir={direction}
                                  onValueChange={onChange}
                                  {...field}
                                  disabled={!selectedLocationId}
                                  data-testid="order-create-fulfillment-shipping-select"
                                >
                                  <Select.Trigger
                                    className="bg-ui-bg-base"
                                    ref={ref}
                                    data-testid="order-create-fulfillment-shipping-trigger"
                                  >
                                    {isShippingOptionsLoading ? (
                                      <span className="text-right" data-testid="order-create-fulfillment-form-shipping-select-loading">
                                        {t("labels.loading")}...
                                      </span>
                                    ) : (
                                      <Select.Value data-testid="order-create-fulfillment-form-shipping-select-value" />
                                    )}
                                  </Select.Trigger>
                                  <Select.Content data-testid="order-create-fulfillment-shipping-content">
                                    {shipping_options.map((o) => (
                                      <Select.Item key={o.id} value={o.id} data-testid={`order-create-fulfillment-shipping-option-${o.id}`}>
                                        {o.name}
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select>
                              </Form.Control>
                            </div>
                          </div>
                          <Form.ErrorMessage data-testid="order-create-fulfillment-shipping-error" />
                        </Form.Item>
                      )
                    }}
                  />

                  {differentOptionSelected && (
                    <Alert className="mt-4 p-4" variant="warning" data-testid="order-create-fulfillment-shipping-warning">
                      <span className="-mt-[3px] block font-medium" data-testid="order-create-fulfillment-form-shipping-warning-title">
                        {t("labels.beaware")}
                      </span>
                      <span className="text-ui-fg-muted" data-testid="order-create-fulfillment-form-shipping-warning-message">
                        {t("orders.fulfillment.differentOptionSelected")}
                      </span>
                    </Alert>
                  )}
                </div>
                <div data-testid="order-create-fulfillment-items-section">
                  <Form.Item className="mt-8" data-testid="order-create-fulfillment-items-item">
                    <Form.Label data-testid="order-create-fulfillment-items-label">
                      {t("orders.fulfillment.itemsToFulfill")}
                    </Form.Label>
                    <Form.Hint data-testid="order-create-fulfillment-items-hint">
                      {t("orders.fulfillment.itemsToFulfillDesc")}
                    </Form.Hint>

                    <div className="flex flex-col gap-y-1" data-testid="order-create-fulfillment-items-list">
                      {fulfillableItems.map((item) => {
                        const isShippingProfileMatching =
                          shipping_options.find(
                            (o) => o.id === shippingOptionId
                          )?.shipping_profile_id ===
                          item.variant?.product?.shipping_profile?.id

                        return (
                          <OrderCreateFulfillmentItem
                            key={item.id}
                            form={form}
                            item={item}
                            locationId={selectedLocationId}
                            disabled={
                              requiresShipping && !isShippingProfileMatching
                            }
                            reservations={reservations}
                          />
                        )
                      })}
                    </div>
                  </Form.Item>
                  {form.formState.errors.root && (
                    <Alert
                      variant="error"
                      dismissible={false}
                      className="flex items-center"
                      classNameInner="flex justify-between flex-1 items-center"
                      data-testid="order-create-fulfillment-items-error"
                    >
                      {form.formState.errors.root.message}
                    </Alert>
                  )}
                </div>

                <div className="mt-8 pt-8 " data-testid="order-create-fulfillment-notification-section">
                  <Form.Field
                    control={form.control}
                    name="send_notification"
                    render={({ field: { onChange, value, ...field } }) => {
                      return (
                        <Form.Item data-testid="order-create-fulfillment-notification-item">
                          <div className="flex items-center justify-between" data-testid="order-create-fulfillment-form-notification-control">
                            <Form.Label data-testid="order-create-fulfillment-notification-label">
                              {t("orders.returns.sendNotification")}
                            </Form.Label>
                            <Form.Control data-testid="order-create-fulfillment-notification-control">
                              <Form.Control>
                                <Switch
                                  dir="ltr"
                                  className="rtl:rotate-180"
                                  checked={!!value}
                                  onCheckedChange={onChange}
                                  {...field}
                                  data-testid="order-create-fulfillment-notification-switch"
                                />
                              </Form.Control>
                            </Form.Control>
                          </div>
                          <Form.Hint className="!mt-1" data-testid="order-create-fulfillment-notification-hint">
                            {t("orders.fulfillment.sendNotificationHint")}
                          </Form.Hint>
                          <Form.ErrorMessage data-testid="order-create-fulfillment-notification-error" />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="order-create-fulfillment-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="order-create-fulfillment-form-footer-actions">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" data-testid="order-create-fulfillment-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isMutating}
              disabled={!shippingOptionId}
              data-testid="order-create-fulfillment-create-button"
            >
              {t("orders.fulfillment.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
