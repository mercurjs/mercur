import { usePermissions } from "@mercurjs/dashboard-shared"
import { useCallback } from "react"
import { SEARCH_AREA_PERMISSIONS } from "./constants"
import { SearchArea } from "./types"

export const useSearchAreaAccess = () => {
  const { can } = usePermissions()

  return useCallback(
    (area: SearchArea) => {
      const key = SEARCH_AREA_PERMISSIONS[area]
      return !key || can(key, "view")
    },
    [can]
  )
}
