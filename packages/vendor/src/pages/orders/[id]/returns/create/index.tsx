// Route: /orders/:id/returns/create
//
// Thin route entry — mirrors admin's `/admin/orders/:id/returns`
// pattern (`return-create.tsx`). Loads the order + preview + return
// reasons, initiates a return draft on mount, and renders the ported
// `ReturnCreateForm` from `_components/`.
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import type { AdminReturn } from "@medusajs/types"

import { RouteFocusModal } from "@components/modals"
import { useOrder, useOrderPreview } from "@hooks/api/orders"
import { useInitiateReturn } from "@hooks/api/returns"

import { ReturnCreateForm } from "./_components/return-create-form"

export const Component = () => {
  const { t } = useTranslation()

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("orders.returns.create")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        {t("orders.returns.confirmText")}
      </RouteFocusModal.Description>
      <ReturnCreateContent />
    </RouteFocusModal>
  )
}

export default Component

const ReturnCreateContent = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const orderId = id ?? ""

  const { order } = useOrder(orderId, {
    // Use `<rel>.*` and bare scalar names. Combining `*foo` with
    // `*foo.bar` (or `+foo.bar.baz`) makes the Medusa query parser look
    // up a literal `*items` / `+items` on Order and 500s. See
    // packages/core/src/api/vendor/orders/query-config.ts.
    fields:
      "currency_code,total,items.*,items.variant.*,items.offer.*,items.offer.inventory_item_link.*,items.offer.inventory_item_link.required_quantity,items.offer.inventory_item_link.inventory_item.*,items.offer.inventory_item_link.inventory_item.location_levels.*",
  })
  const { order: preview } = useOrderPreview(orderId)

  const [activeReturn, setActiveReturn] = useState<AdminReturn | undefined>(
    undefined
  )
  const isInitiatingRef = useRef(false)
  const { mutateAsync: initiateReturn } = useInitiateReturn(orderId)

  useEffect(() => {
    async function run() {
      if (isInitiatingRef.current || activeReturn || !order || !preview) {
        return
      }
      isInitiatingRef.current = true
      try {
        const res = await initiateReturn({ order_id: orderId })
        const r = (res as { return?: AdminReturn })?.return
        if (r) {
          setActiveReturn(r)
        }
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
        )
        navigate(`/orders/${orderId}`, { replace: true })
      } finally {
        isInitiatingRef.current = false
      }
    }
    run()
  }, [order, preview, activeReturn, initiateReturn, orderId, navigate, t])

  const ready = !!(order && preview && activeReturn)

  if (!ready) {
    return null
  }

  return (
    <ReturnCreateForm
      order={order}
      preview={preview}
      activeReturn={activeReturn}
    />
  )
}
