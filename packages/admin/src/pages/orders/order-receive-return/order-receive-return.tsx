import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heading, toast } from "@medusajs/ui"
import { useEffect } from "react"

import { useOrder, useOrderPreview } from "../../../hooks/api/orders"
import { RouteDrawer } from "../../../components/modals"
import { useWarehouseCapabilityGuard } from "../../../hooks/use-warehouse-capability-guard"
import { OrderReceiveReturnForm } from "./components/order-receive-return-form"
import {
  useAddReceiveItems,
  useInitiateReceiveReturn,
  useReturn,
} from "../../../hooks/api/returns"

let IS_REQUEST_RUNNING = false

export function OrderReceiveReturn() {
  const { id, return_id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseAvailable = useWarehouseCapabilityGuard()

  /**
   * HOOKS
   */

  const { order } = useOrder(
    id!,
    { fields: "+currency_code,*items" },
    { enabled: warehouseAvailable }
  )
  const { order: preview } = useOrderPreview(id!, undefined, {
    enabled: warehouseAvailable,
  })
  const { return: orderReturn } = useReturn(
    return_id,
    {
      fields: "*items.item,*items.item.variant,*items.item.variant.product",
    },
    { enabled: warehouseAvailable }
  ) // TODO: fix API needs to return 404 if return not exists and not an empty object

  /**
   * MUTATIONS
   */

  const { mutateAsync: initiateReceiveReturn } = useInitiateReceiveReturn(
    return_id,
    id
  )

  const { mutateAsync: addReceiveItems } = useAddReceiveItems(return_id, id)

  useEffect(() => {
    ;(async function () {
      if (!warehouseAvailable || IS_REQUEST_RUNNING || !preview) {
        return
      }

      if (preview.order_change) {
        if (preview.order_change.change_type !== "return_receive") {
          navigate(`/orders/${id}`, { replace: true })
          toast.error(t("orders.returns.activeChangeError"))
        }
        return
      }

      IS_REQUEST_RUNNING = true

      try {
        const { return: _return } = await initiateReceiveReturn({})

        await addReceiveItems({
          items: _return.items.map((i) => ({
            id: i.item_id,
            quantity: i.quantity,
          })),
        })
      } catch (e) {
        toast.error(e.message)
      } finally {
        IS_REQUEST_RUNNING = false
      }
    })()
  }, [preview, warehouseAvailable])

  const ready = warehouseAvailable && order && orderReturn && preview

  return (
    <RouteDrawer prev="../../.." data-testid="order-receive-return-drawer">
      <RouteDrawer.Header data-testid="order-receive-return-header">
        <Heading data-testid="order-receive-return-heading">
          {t("orders.returns.receive.title", {
            returnId: return_id?.slice(-7),
          })}
        </Heading>
      </RouteDrawer.Header>
      {ready && (
        <OrderReceiveReturnForm
          order={order}
          orderReturn={orderReturn}
          preview={preview}
        />
      )}
    </RouteDrawer>
  )
}
