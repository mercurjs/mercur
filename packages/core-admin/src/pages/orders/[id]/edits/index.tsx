import { toast } from "@medusajs/ui"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useOrder, useOrderPreview } from "@hooks/api/orders"
import { useCreateOrderEdit } from "@hooks/api/order-edits"
import { DEFAULT_FIELDS } from "../constants"
import { OrderEditCreateForm } from "./_components/order-edit-create-form"

let IS_REQUEST_RUNNING = false

export const Component = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { order } = useOrder(id!, {
    fields: DEFAULT_FIELDS,
  })

  const { order: preview } = useOrderPreview(id!)
  const { mutateAsync: createOrderEdit } = useCreateOrderEdit(order?.id!)

  useEffect(() => {
    async function run() {
      if (IS_REQUEST_RUNNING || !preview || !order) {
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
      } catch (e: any) {
        toast.error(e.message)
        navigate(`/orders/${preview.id}`, { replace: true })
      } finally {
        IS_REQUEST_RUNNING = false
      }
    }

    run()
  }, [preview, order])

  return (
    <RouteFocusModal data-testid="order-edit-create-modal">
      {preview && order && (
        <OrderEditCreateForm order={order} preview={preview} />
      )}
    </RouteFocusModal>
  )
}
