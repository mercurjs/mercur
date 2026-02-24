
import type { StaticCountry } from "@lib/data/countries"
import type { HttpTypes } from "@medusajs/types"

/**
 * Converts API region countries to static countries for use with useCountries hook.
 * StaticCountry requires all fields to be non-optional (except id which is omitted).
 */
export const convertToStaticCountries = (
  apiCountries: HttpTypes.AdminRegionCountry[] | undefined
): StaticCountry[] => {
  if (!apiCountries) {
    return []
  }

  return apiCountries
    .filter((c): c is Required<HttpTypes.AdminRegionCountry> => {
      const requiredFields: (keyof HttpTypes.AdminRegionCountry)[] = [
        'iso_2', 'iso_3', 'num_code', 'name', 'display_name'
      ]
      
      return requiredFields.every(field => !!c[field])
    })
    .map(({ ...country }) => country as StaticCountry)
}

