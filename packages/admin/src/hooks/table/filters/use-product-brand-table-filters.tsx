import { useDateTableFilters } from "./use-date-table-filters"

export const useProductBrandTableFilters = () => {
  const dateFilters = useDateTableFilters()

  return dateFilters
}
