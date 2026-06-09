// Route: /orders/:id/edit
//
// SPEC-008 — Edit Order focus modal. Initiates an order-edit draft on mount
// (`useCreateOrderEdit`), then hands off to `<OrderEditCreateForm />` which
// walks the draft through request → confirm. Cancel closes the modal and
// discards the draft via `useCancelOrderEdit` (wired in the form's
// `onClose`). Redirects away if a non-edit change is already active on the
// order.
import { toast } from "@medusajs/ui"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useCreateOrderEdit } from "@hooks/api/order-edits"
import { useOrder, useOrderPreview } from "@hooks/api/orders"

import { OrderEditCreateForm } from "./_components/order-edit-create-form"

// Module-local flag to dedupe React Strict Mode double-renders firing
// `createOrderEdit` twice on mount.
let IS_REQUEST_RUNNING = false

export const Component = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const orderId = id ?? ""

  const { order } = useOrder(orderId, {
    // Use the `<rel>.*` suffix form. Combining `*foo` with `*foo.bar`
    // (or the `+foo.bar.baz` form) makes Medusa's query parser try to
    // look up a literal property called `*items` / `+items` on Order
    // and 500. See packages/core/src/api/vendor/orders/query-config.ts
    // for the matching guidance applied to the defaults.
    fields: "currency_code,total,items.*,items.variant.*",
  })

  const { order: preview } = useOrderPreview(orderId)
  const { mutateAsync: createOrderEdit } = useCreateOrderEdit(orderId)

  useEffect(() => {
    async function run() {
      if (IS_REQUEST_RUNNING || !preview) {
        return
      }

      if (preview.order_change) {
        if (preview.order_change.change_type !== "edit") {
          navigate(`/orders/${preview.id}`, { replace: true })
          toast.error(t("orders.edits.activeChangeError"))
        }

        return
      }

      IS_REQUEST_RUNNING = true

      try {
        await createOrderEdit({
          order_id: preview.id,
        })
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
        )
        navigate(`/orders/${preview.id}`, { replace: true })
      } finally {
        IS_REQUEST_RUNNING = false
      }
    }

    run()
  }, [preview])

  return (
    <RouteFocusModal>
      {preview && order && (
        <OrderEditCreateForm order={order} preview={preview} />
      )}
    </RouteFocusModal>
  )
}

export default Component
