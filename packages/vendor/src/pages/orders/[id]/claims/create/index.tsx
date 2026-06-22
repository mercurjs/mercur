// Route: /orders/:id/claims/create
//
// 1:1 port of Medusa admin `claim-create.tsx` — the parent loads
// `order`, `preview`, kicks off `createClaim`, then hydrates `claim`
// and `orderReturn`. `ClaimCreateForm` is only mounted once all four
// are loaded so it can rely on non-null props (no `?? ""` fallbacks
// inside the form).
import { toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useClaim, useCreateClaim } from "@hooks/api/claims"
import { useOrder, useOrderPreview } from "@hooks/api/orders"
import { useReturn } from "@hooks/api/returns"

import { DEFAULT_FIELDS } from "../../constants"
import { ClaimCreateForm } from "./_components/claim-create-form"

let IS_REQUEST_RUNNING = false

export const Component = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { order } = useOrder(id!, {
    fields: DEFAULT_FIELDS,
  })

  const { order: preview } = useOrderPreview(id!)
  const [activeClaimId, setActiveClaimId] = useState<string>()
  const { mutateAsync: createClaim } = useCreateClaim(order?.id ?? "")

  const { claim } = useClaim(activeClaimId!, undefined, {
    enabled: !!activeClaimId,
  })
  const { return: orderReturn } = useReturn(claim?.return_id!, undefined, {
    enabled: !!claim?.return_id,
  })

  useEffect(() => {
    async function run() {
      if (IS_REQUEST_RUNNING || !preview) {
        return
      }

      if (preview.order_change) {
        if (preview.order_change.change_type === "claim") {
          setActiveClaimId(preview.order_change.claim_id)
        } else {
          navigate(`/orders/${preview.id}`, { replace: true })
          toast.error(t("orders.claims.activeChangeError"))
        }

        return
      }

      IS_REQUEST_RUNNING = true

      try {
        const { claim: createdClaim } = await createClaim({
          order_id: preview.id,
          type: "replace",
        })

        setActiveClaimId(createdClaim.id)
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
    /* oxlint-disable react-hooks/exhaustive-deps */
  }, [preview])
  /* oxlint-enable react-hooks/exhaustive-deps */

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("orders.claims.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        {t("orders.claims.title")}
      </RouteFocusModal.Description>
      {claim && preview && order && (
        <ClaimCreateForm
          order={order}
          claim={claim}
          preview={preview}
          orderReturn={orderReturn}
        />
      )}
    </RouteFocusModal>
  )
}

export default Component
