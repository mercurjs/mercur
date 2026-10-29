const FIRST_PARTY_PREFIXES = ["@mercurjs/", "@medusajs/"]

export const isFirstPartyName = (name: string) =>
  FIRST_PARTY_PREFIXES.some((prefix) => name.startsWith(prefix))

export type NameSplit = {
  first_party: string[]
  custom_count: number
}

/**
 * Keeps only package names Mercur or Medusa publish. Anything else is counted,
 * never named, because a custom plugin or provider name can identify a company.
 */
export function splitFirstParty(names: Array<string | undefined | null>): NameSplit {
  const first_party = new Set<string>()
  let custom_count = 0

  for (const name of names) {
    if (!name) continue
    if (isFirstPartyName(name)) {
      first_party.add(name)
    } else {
      custom_count += 1
    }
  }

  return { first_party: [...first_party].sort(), custom_count }
}

export const providerIdLabel = (resolve: string | undefined, id: string | undefined) => {
  if (!resolve || !id) return undefined
  return isFirstPartyName(resolve) ? `${resolve}#${id}` : "custom"
}
