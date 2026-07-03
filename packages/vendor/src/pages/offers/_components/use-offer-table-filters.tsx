import { useProductTableFilters } from "../../../hooks/table/filters/use-product-table-filters"

/**
 * The Offers list is product-backed (SPEC-009), so its filters are the
 * product filters confirmed against Figma `40016482:525329`: Category,
 * Collection, Type, Tag, Status, Created, Updated. Reuses the shared
 * product-table filter hook verbatim.
 */
export const useOfferTableFilters = () => useProductTableFilters()
