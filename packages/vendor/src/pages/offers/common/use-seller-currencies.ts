import { useCan } from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"

import { useRegions } from "../../../hooks/api/regions"

export const useSellerCurrencies = () => {
  const canViewRegions = useCan("regions")
  const { regions: fetchedRegions, isPending, isError, error } = useRegions(
    { fields: "id,name,currency_code", limit: 999 },
    { enabled: canViewRegions },
  )

  const regions = useMemo<HttpTypes.AdminRegion[]>(
    () => (canViewRegions ? (fetchedRegions ?? []) : []),
    [canViewRegions, fetchedRegions],
  )

  const currencies = useMemo(
    () => Array.from(new Set(regions.map((r) => r.currency_code))),
    [regions],
  )

  return {
    regions,
    currencies,
    isPending: canViewRegions && isPending,
    isError,
    error,
  }
}
