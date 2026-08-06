export const toHreflang = (code: string): string => {
  const map: Record<string, string> = {
    us: "en-US",
    gb: "en-GB",
    au: "en-AU",
    ca: "en-CA",
    ie: "en-IE",
    pl: "pl-PL",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    it: "it-IT",
    nl: "nl-NL",
    se: "sv-SE",
    no: "nb-NO",
    dk: "da-DK",
    cz: "cs-CZ",
    sk: "sk-SK",
    pt: "pt-PT",
    br: "pt-BR",
    at: "de-AT",
    ch: "de-CH",
    cn: "zh-CN",
    jp: "ja-JP",
    kr: "ko-KR",
    tw: "zh-TW",
    hk: "zh-HK",
    sg: "en-SG",
    my: "ms-MY",
  }
  return map[code] || code
}

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

// The storefront serves every page under a locale prefix (/de, /se, ...);
// requests without one are 307-redirected by the middleware. x-default must
// therefore resolve to a locale that actually returns 200, never the bare path.
export const resolveXDefaultLocale = (locales: string[]): string => {
  if (!locales.length) return DEFAULT_REGION
  for (const preferred of [DEFAULT_REGION, "us", "gb"]) {
    if (locales.includes(preferred)) return preferred
  }
  return locales[0]
}

export const getStorefrontLocales = (
  regions: { countries?: { iso_2?: string | null }[] | null }[] | null
): string[] =>
  Array.from(
    new Set(
      (regions || []).flatMap(
        (r) => r.countries?.map((c) => c.iso_2).filter(Boolean) || []
      )
    )
  ) as string[]

type HreflangAlternates = {
  canonical: string
  languages: Record<string, string>
}

// Builds hreflang alternates where every entry — including x-default and the
// self-referencing link — points at a locale-prefixed URL that returns 200.
export const buildHreflangAlternates = ({
  baseUrl,
  path,
  locale,
  locales,
}: {
  baseUrl: string
  // Path after the locale segment, starting with "/" (empty string for home).
  path: string
  locale: string
  locales: string[]
}): HreflangAlternates => {
  const list = locales.length ? locales : [locale]

  const languages = list.reduce<Record<string, string>>((acc, code) => {
    acc[toHreflang(code)] = `${baseUrl}/${code}${path}`
    return acc
  }, {})

  languages["x-default"] = `${baseUrl}/${resolveXDefaultLocale(list)}${path}`

  return {
    canonical: `${baseUrl}/${locale}${path}`,
    languages,
  }
}
