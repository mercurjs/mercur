// Route: /orders/:id/returns/:return_id/receive
//
// Thin route entry. Mirrors admin's `order-receive-return.tsx`:
// data load + initiate-receive-return guard at this level, drawer shell
// hosts the form. The form itself calls `useRouteModal()` because it
// renders INSIDE `<RouteDrawer>` (which provides `RouteModalProvider`).
// The previous single-file vendor route called `useRouteModal()` here,
// outside the provider, which threw "useRouteModal must be used within
// a RouteModalProvider".
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Heading, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { RouteDrawer } from "@components/modals"
import { useOrder, useOrderPreview } from "@hooks/api/orders"
import {
  useAddReceiveItems,
  useInitiateReceiveReturn,
  useReturn,
} from "@hooks/api/returns"

import { OrderReceiveReturnForm } from "./_components/order-receive-return-form"

let IS_REQUEST_RUNNING = false

export const Component = () => {
  const { id, return_id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const orderId = id ?? ""
  const returnId = return_id ?? ""

  const { order } = useOrder(orderId, { fields: "+currency_code,*items" })
  const { order: preview } = useOrderPreview(orderId)
  const { return: orderReturn } = useReturn(returnId, {
    fields: "*items.item,*items.item.variant,*items.item.variant.product",
  })

  const { mutateAsync: initiateReceiveReturn } = useInitiateReceiveReturn(
    returnId,
    orderId
  )
  const { mutateAsync: addReceiveItems } = useAddReceiveItems(
    returnId,
    orderId
  )

  useEffect(() => {
    ;(async () => {
      if (IS_REQUEST_RUNNING || !preview) {
        return
      }

      if (preview.order_change) {
        if ((preview.order_change.change_type as string) !== "return_receive") {
          navigate(`/orders/${orderId}`, { replace: true })
          toast.error(t("orders.returns.activeChangeError"))
        }
        return
      }

      if (!orderReturn) {
        return
      }

      IS_REQUEST_RUNNING = true
      try {
        const { return: initiated } = await initiateReceiveReturn({})
        await addReceiveItems({
          items: initiated.items.map(
            (i: { item_id: string; quantity: number }) => ({
              id: i.item_id,
              quantity: i.quantity,
            })
          ),
        })
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
        )
      } finally {
        IS_REQUEST_RUNNING = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, orderReturn])

  const ready = !!order && !!orderReturn && !!preview

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {t("orders.returns.receive.title", {
              returnId: returnId.slice(-7),
            })}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("orders.returns.receive.itemsLabel")}
        </RouteDrawer.Description>
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

export default Component
