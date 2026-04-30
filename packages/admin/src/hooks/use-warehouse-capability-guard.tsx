import { useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "@medusajs/ui"

import { useFeatureFlags, useWarehouseManagement } from "./api/feature-flags"

/**
 * Route guard for admin warehouse pages. When the `admin_warehouse_management`
 * feature flag is off (baseline Mercur), redirects to the parent order detail
 * and surfaces a toast explaining the capability is disabled.
 *
 * Usage:
 *   const guarded = useWarehouseCapabilityGuard()
 *   if (!guarded) return null
 *
 * Returns `false` until the flag resolves OR when the redirect is in flight;
 * returns `true` once it is safe to render the page body.
 */
export const useWarehouseCapabilityGuard = (): boolean => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoading } = useFeatureFlags()
  const enabled = useWarehouseManagement()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (isLoading || enabled || hasRedirected.current) {
      return
    }

    hasRedirected.current = true
    toast.error("Admin warehouse management is not enabled for this deployment.")
    navigate(id ? `/orders/${id}` : "/orders", { replace: true })
  }, [isLoading, enabled, id, navigate])

  return !isLoading && enabled
}
