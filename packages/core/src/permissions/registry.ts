import {
  PERMISSION_RIGHT_RANK,
  PermissionDefinition,
  PermissionMap,
  PermissionRight,
} from "@mercurjs/types"

type PermissionRegistry = Map<string, PermissionDefinition>

declare global {
  var __mercurPermissions: PermissionRegistry | undefined
}

// Kept on globalThis so plugins that bundle their own copy of core still
// register into the same catalog.
const registry: PermissionRegistry = (globalThis.__mercurPermissions ??=
  new Map())

export function defineMercurPermissions(
  definitions: PermissionDefinition | PermissionDefinition[]
): PermissionDefinition[] {
  const list = Array.isArray(definitions) ? definitions : [definitions]

  for (const definition of list) {
    if (!definition.key || !definition.group || !definition.rights?.length) {
      throw new Error(
        `Permission definition must include key, group and at least one right. Received: ${JSON.stringify(definition)}`
      )
    }

    // Last definition wins: module reloads in `medusa develop` re-run these
    // files, and projects may intentionally redefine a core permission.
    registry.set(definition.key, definition)
  }

  return list
}

export function getPermissionCatalog(): PermissionDefinition[] {
  return [...registry.values()]
}

export function getPermission(key: string): PermissionDefinition | undefined {
  return registry.get(key)
}

export function highestRight(definition: PermissionDefinition): PermissionRight {
  return definition.rights.reduce((highest, right) =>
    PERMISSION_RIGHT_RANK[right] > PERMISSION_RIGHT_RANK[highest]
      ? right
      : highest
  )
}

export function satisfiesRight(
  granted: PermissionRight | undefined,
  required: PermissionRight
): boolean {
  return (
    !!granted && PERMISSION_RIGHT_RANK[granted] >= PERMISSION_RIGHT_RANK[required]
  )
}

export function grantAll(catalog: PermissionDefinition[]): PermissionMap {
  const map: PermissionMap = {}
  for (const definition of catalog) {
    map[definition.key] = highestRight(definition)
  }
  return map
}

/**
 * Throws on requirements pointing at unknown keys or rights, and on dependency
 * cycles. Run once at boot so a broken catalog fails loudly instead of
 * silently denying access.
 */
export function validatePermissionCatalog(
  catalog: PermissionDefinition[] = getPermissionCatalog()
): void {
  const byKey = new Map(catalog.map((definition) => [definition.key, definition]))

  for (const definition of catalog) {
    for (const requirement of definition.requires ?? []) {
      const target = byKey.get(requirement.key)
      if (!target) {
        throw new Error(
          `Permission "${definition.key}" requires unknown permission "${requirement.key}"`
        )
      }
      if (!target.rights.includes(requirement.right)) {
        throw new Error(
          `Permission "${definition.key}" requires "${requirement.key}:${requirement.right}", which is not a right of "${requirement.key}"`
        )
      }
    }
  }

  const visiting = new Set<string>()
  const done = new Set<string>()

  const visit = (key: string, path: string[]) => {
    if (done.has(key)) {
      return
    }
    if (visiting.has(key)) {
      throw new Error(
        `Permission dependency cycle: ${[...path, key].join(" -> ")}`
      )
    }
    visiting.add(key)
    for (const requirement of byKey.get(key)?.requires ?? []) {
      visit(requirement.key, [...path, key])
    }
    visiting.delete(key)
    done.add(key)
  }

  for (const definition of catalog) {
    visit(definition.key, [])
  }
}
