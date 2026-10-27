import type { CreateShippingZoneGeoDTO, ShippingZoneDTO } from "@mercurjs/types"

import { countries, getCountryByIso2 } from "../../../lib/data/countries"

export const countryOptions = countries.map((country) => ({
  value: country.iso_2,
  label: country.display_name,
}))

export const getZoneCountryCodes = (zone: ShippingZoneDTO) => [
  ...new Set(zone.geo_zones.map((geo) => geo.country_code)),
]

export const getZoneCountryNames = (zone: ShippingZoneDTO) =>
  getZoneCountryCodes(zone).map(
    (code) => getCountryByIso2(code)?.display_name ?? code.toUpperCase()
  )

export const buildGeoZones = (
  countryCodes: string[],
  existing: ShippingZoneDTO["geo_zones"] = []
): CreateShippingZoneGeoDTO[] => {
  const provinces = existing
    .filter(
      (geo) =>
        geo.type === "province" && countryCodes.includes(geo.country_code)
    )
    .map((geo) => ({
      type: geo.type,
      country_code: geo.country_code,
      province_code: geo.province_code,
    }))

  const countriesWithProvinces = new Set(provinces.map((p) => p.country_code))

  return [
    ...countryCodes
      .filter((code) => !countriesWithProvinces.has(code))
      .map((code) => ({ type: "country" as const, country_code: code })),
    ...provinces,
  ]
}

export const generateCode = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
