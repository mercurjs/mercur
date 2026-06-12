import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Alert, Button, Heading, Input, Select, toast } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"

import { Form } from "@components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { ordersQueryKeys } from "@hooks/api/orders"
import { useCreateReservationItem } from "@hooks/api/reservations"
import { useStockLocations } from "@hooks/api/stock-locations"
import { queryClient } from "@lib/query-client"
import { getFulfillableQuantity } from "@lib/order-item"
import { AllocateItemsSchema } from "./constants"
import {
  OrderAllocateItemsItem,
  type OfferLinkRow,
  type OrderLineItemWithOffer,
} from "./order-allocate-items-item"
import { buildAllocationPayload } from "./utils"
import type { HttpTypes, OrderLineItemDTO } from "@medusajs/types"

type OrderAllocateItemsFormProps = {
  order: HttpTypes.AdminOrder
}

export function OrderAllocateItemsForm({ order }: OrderAllocateItemsFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const [disableSubmit, setDisableSubmit] = useState(false)
  const [filterTerm, setFilterTerm] = useState("")

  const { mutateAsync: allocateItems, isPending: isMutating } =
    useCreateReservationItem()

  const itemsToAllocate = useMemo(
    () =>
      (order.items as OrderLineItemWithOffer[]).filter(
        (item) =>
          !!item.offer?.inventory_item_link?.length &&
          item?.quantity - (item.detail?.fulfilled_quantity ?? 0) > 0
      ),
    [order.items]
  )

  const filteredItems = useMemo(() => {
    return itemsToAllocate.filter(
      (i) =>
        i.variant_title?.toLowerCase().includes(filterTerm) ||
        i.product_title?.toLowerCase().includes(filterTerm)
    )
  }, [itemsToAllocate, filterTerm])

  const form = useForm<zod.infer<typeof AllocateItemsSchema>>({
    defaultValues: {
      location_id: "",
      quantity: defaultAllocations(itemsToAllocate),
      selected: defaultSelected(itemsToAllocate),
    },
    resolver: zodResolver(AllocateItemsSchema),
  })

  const { stock_locations = [] } = useStockLocations()

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const result = buildAllocationPayload(data.quantity, data.selected)

      if (!result.ok) {
        form.setError("root.quantityNotAllocated", {
          type: "manual",
          message:
            result.reason === "no-items"
              ? t("orders.allocateItems.error.noItemsSelected")
              : t("orders.allocateItems.error.quantityNotAllocated"),
        })

        return
      }

      const promises = result.items.map((item) =>
        allocateItems({
          location_id: data.location_id,
          inventory_item_id: item.inventory_item_id,
          line_item_id: item.line_item_id,
          quantity: item.quantity,
        })
      )

      /**
       * TODO: we should have bulk endpoint for this so this is executed in a workflow and can be reverted
       */
      await Promise.all(promises)

      await queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      handleSuccess(`/orders/${order.id}`)

      toast.success(t("general.success"), {
        description: t("orders.allocateItems.toast.created"),
      })
    } catch (e) {
      toast.error(t("general.error"), {
        description: e instanceof Error ? e.message : "An unknown error occurred",
      })
    }
  })

  const onToggleSelected = (itemId: string, checked: boolean) => {
    form.setValue(`selected.${itemId}` as `selected.${string}`, checked)
    form.clearErrors("root.quantityNotAllocated")
  }

  const onQuantityChange = (
    link: OfferLinkRow,
    lineItem: OrderLineItemWithOffer,
    hasInventoryKit: boolean,
    value: number | null,
    isRoot?: boolean
  ) => {
    let shouldDisableSubmit = false

    const inventoryItemId = resolveInventoryItemId(link)

    const key =
      isRoot && hasInventoryKit
        ? `quantity.${lineItem.id}-`
        : `quantity.${lineItem.id}-${inventoryItemId ?? ""}`

    form.setValue(key as `quantity.${string}`, value ?? "")

    const levels = link.inventory_item?.location_levels
    if (value && levels) {
      const location = levels.find((l) => l.location_id === selectedLocationId)
      if (location && (location.available_quantity ?? 0) < value) {
        shouldDisableSubmit = true
      }
    }

    if (hasInventoryKit && !isRoot) {
      form.resetField(`quantity.${lineItem.id}-` as `quantity.${string}`, { defaultValue: "" })
    }

    if (hasInventoryKit && isRoot) {
      const item = itemsToAllocate.find((i) => i.id === lineItem.id)

      if (!item || !item.offer?.inventory_item_link) return

      item.offer.inventory_item_link.forEach((childLink) => {
        const num = value || 0
        const childInventoryItemId = resolveInventoryItemId(childLink)
        if (!childInventoryItemId) return

        const required = childLink.required_quantity ?? 1

        form.setValue(
          `quantity.${lineItem.id}-${childInventoryItemId}` as `quantity.${string}`,
          num * required
        )

        const childLevels = childLink.inventory_item?.location_levels
        if (value && childLevels) {
          const location = childLevels.find(
            (l) => l.location_id === selectedLocationId
          )
          if (location && (location.available_quantity ?? 0) < num * required) {
            shouldDisableSubmit = true
          }
        }
      })
    }

    form.clearErrors("root.quantityNotAllocated")
    setDisableSubmit(shouldDisableSubmit)
  }

  const selectedLocationId = useWatch({
    name: "location_id",
    control: form.control,
  })

  useEffect(() => {
    if (selectedLocationId) {
      form.setValue(
        "quantity",
        defaultAllocations(itemsToAllocate, selectedLocationId)
      )
    }
  }, [
	selectedLocationId,
	form,
	itemsToAllocate
])

  const allocationError =
    form.formState.errors?.root?.quantityNotAllocated?.message

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex h-full w-full flex-col items-center divide-y overflow-y-auto">
          <div className="flex size-full flex-col items-center overflow-auto p-16">
            <div className="flex w-full max-w-[736px] flex-col justify-center px-2 pb-2">
              <div className="flex flex-col gap-8 divide-y divide-dashed">
                <Heading>{t("orders.allocateItems.title")}</Heading>
                <div className="flex-1 divide-y divide-dashed pt-8">
                  <Form.Field
                    control={form.control}
                    name="location_id"
                    render={({ field: { onChange, ref, ...field } }) => {
                      return (
                        <Form.Item>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Form.Label>{t("fields.location")}</Form.Label>
                              <Form.Hint>
                                {t("orders.allocateItems.locationDescription")}
                              </Form.Hint>
                            </div>
                            <div className="flex-1">
                              <Form.Control>
                                <Select onValueChange={onChange} {...field}>
                                  <Select.Trigger
                                    className="bg-ui-bg-base"
                                    ref={ref}
                                  >
                                    <Select.Value />
                                  </Select.Trigger>
                                  <Select.Content>
                                    {stock_locations.map((l) => (
                                      <Select.Item key={l.id} value={l.id}>
                                        {l.name}
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select>
                              </Form.Control>
                            </div>
                          </div>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />

                  <Form.Item className="mt-8 pt-8">
                    <div className="flex flex-row items-center">
                      <div className="flex-1">
                        <Form.Label>
                          {t("orders.allocateItems.itemsToAllocate")}
                        </Form.Label>
                        <Form.Hint>
                          {t("orders.allocateItems.itemsToAllocateDesc")}
                        </Form.Hint>
                      </div>
                      <div className="flex-1">
                        <Input
                          value={filterTerm}
                          onChange={(e) => setFilterTerm(e.target.value)}
                          placeholder={t("orders.allocateItems.search")}
                          autoComplete="off"
                          type="search"
                        />
                      </div>
                    </div>

                    {allocationError && (
                      <Alert className="mb-4" dismissible variant="error">
                        {allocationError}
                      </Alert>
                    )}

                    <div className="flex flex-col gap-y-2">
                      {filteredItems.map((item) => (
                        <OrderAllocateItemsItem
                          key={item.id}
                          form={form}
                          item={item}
                          locationId={selectedLocationId}
                          onQuantityChange={onQuantityChange}
                          onToggleSelected={onToggleSelected}
                        />
                      ))}
                    </div>
                  </Form.Item>
                </div>
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
              disabled={!selectedLocationId || disableSubmit}
            >
              {t("orders.allocateItems.action")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

const resolveInventoryItemId = (link: OfferLinkRow): string | null =>
  link.inventory_item?.id ?? link.inventory_item_id ?? null

// Clamp a desired quantity to what is actually available at the chosen
// location so the prefill never proposes more than can be reserved. Until a
// location is picked there is nothing to clamp against, so the raw value is
// returned.
const clampToAvailable = (
  desired: number,
  link: OfferLinkRow,
  locationId?: string
): number => {
  if (!locationId) {
    return desired
  }

  const level = link.inventory_item?.location_levels?.find(
    (l) => l.location_id === locationId
  )
  const available = level?.available_quantity ?? Number.MAX_SAFE_INTEGER

  return Math.max(0, Math.min(desired, available))
}

// Prefill each allocatable row with its outstanding (fulfillable) quantity so
// the default state is a valid, one-click allocation. Kit roots keep the
// trailing-dash aggregator key (UI only); child rows are scaled by the kit's
// required quantity.
function defaultAllocations(
  items: OrderLineItemWithOffer[],
  locationId?: string
) {
  const ret: Record<string, string | number> = {}

  items.forEach((item) => {
    const links = item.offer?.inventory_item_link ?? []
    const hasInventoryKit = links.length > 1
    const firstLink = links[0]
    const firstInventoryItemId = resolveInventoryItemId(firstLink ?? {})
    const fulfillable = getFulfillableQuantity(
      item as unknown as OrderLineItemDTO
    )

    if (hasInventoryKit) {
      ret[`${item.id}-`] = fulfillable
      links.forEach((link) => {
        const id = resolveInventoryItemId(link)
        if (!id) return
        const required = link.required_quantity ?? 1
        ret[`${item.id}-${id}`] = clampToAvailable(
          fulfillable * required,
          link,
          locationId
        )
      })
    } else {
      ret[`${item.id}-${firstInventoryItemId ?? ""}`] = clampToAvailable(
        fulfillable,
        firstLink ?? {},
        locationId
      )
    }
  })

  return ret
}

function defaultSelected(items: OrderLineItemWithOffer[]) {
  const ret: Record<string, boolean> = {}
  items.forEach((item) => {
    ret[item.id] = true
  })
  return ret
}
