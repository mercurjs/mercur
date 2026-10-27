import type { CreateShippingZoneGeoDTO, ShippingZoneDTO } from "@mercurjs/types"

import type { TFunction } from "i18next"

import { countries, getCountryByIso2 } from "../../../lib/data/countries"
import { getCountryProvinceObjectByIso2 } from "../../../lib/data/country-states"

export const countryOptions = countries.map((country) => ({
  value: country.iso_2,
  label: country.display_name,
}))

export type ZoneProvinces = Record<string, string[]>

export const getProvinceOptions = (countryCode: string) =>
  Object.entries(
    getCountryProvinceObjectByIso2(countryCode)?.options ?? {}
  ).map(([iso2, name]) => ({ value: iso2.toLowerCase(), label: name }))

export const getZoneCountryCodes = (zone: ShippingZoneDTO) => [
  ...new Set(zone.geo_zones.map((geo) => geo.country_code)),
]

export const getZoneProvinces = (zone: ShippingZoneDTO): ZoneProvinces =>
  zone.geo_zones.reduce<ZoneProvinces>((acc, geo) => {
    if (geo.type === "province" && geo.province_code) {
      acc[geo.country_code] = [
        ...(acc[geo.country_code] ?? []),
        geo.province_code,
      ]
    }

    return acc
  }, {})

export const getZoneCountrySummaries = (
  zone: ShippingZoneDTO,
  t: TFunction
) => {
  const provinces = getZoneProvinces(zone)

  return getZoneCountryCodes(zone).map((code) => {
    const country =
      getCountryByIso2(code)?.display_name ?? code.toUpperCase()
    const count = provinces[code]?.length ?? 0

    return count
      ? t("shippingZones.fields.countryProvinces", { country, count })
      : country
  })
}

export const buildGeoZones = (
  countryCodes: string[],
  provinces: ZoneProvinces = {}
): CreateShippingZoneGeoDTO[] =>
  countryCodes.flatMap((code): CreateShippingZoneGeoDTO[] => {
    const selected = provinces[code] ?? []

    if (!selected.length) {
      return [{ type: "country", country_code: code }]
    }

    return selected.map((province) => ({
      type: "province",
      country_code: code,
      province_code: province,
    }))
  })

export const generateCode = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
