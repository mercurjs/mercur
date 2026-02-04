import type { NavItem } from './types'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  severity: ValidationSeverity
  code: string
  message: string
  navId?: string
  details?: Record<string, unknown>
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  items: Map<string, NavItem>
}

const MISC_SECTION = 'misc'
const MAX_NESTING_DEPTH = 3

export function validateNavigation(
  coreItems: Map<string, NavItem>,
  userItems: Map<string, NavItem>,
  patches: Partial<NavItem>[] = [],
  availableRoutes: Set<string> = new Set()
): ValidationResult {
  const issues: ValidationIssue[] = []
  const mergedItems = new Map<string, NavItem>()

  for (const [id, item] of coreItems) {
    mergedItems.set(id, { ...item })
  }

  for (const [id, item] of userItems) {
    if (coreItems.has(id)) {
      issues.push({
        severity: 'error',
        code: 'NAV_ID_COLLISION',
        message: `User nav item "${id}" collides with core-admin item. Use different id or override via mercur.config.ts patch.`,
        navId: id,
      })
      continue
    }
    mergedItems.set(id, { ...item })
  }

  for (const patch of patches) {
    if (!patch.id) {
      issues.push({
        severity: 'warning',
        code: 'PATCH_MISSING_ID',
        message: 'Patch is missing id field, skipping',
      })
      continue
    }

    const existing = mergedItems.get(patch.id)
    if (!existing) {
      issues.push({
        severity: 'warning',
        code: 'PATCH_UNKNOWN_ID',
        message: `Patch references unknown nav id "${patch.id}", skipping`,
        navId: patch.id,
      })
      continue
    }

    mergedItems.set(patch.id, { ...existing, ...patch, id: patch.id })
  }

  const hasError = issues.some(i => i.severity === 'error')
  if (hasError) {
    return { valid: false, issues, items: new Map() }
  }

  validateParentReferences(mergedItems, issues)
  validateSections(mergedItems, issues)
  validateNestingDepth(mergedItems, issues)
  validateDynamicRoutes(mergedItems, issues)
  validatePaths(mergedItems, availableRoutes, issues)
  validateLabels(mergedItems, issues)
  applyFallbacks(mergedItems, issues)

  const finalValid = !issues.some(i => i.severity === 'error')

  return {
    valid: finalValid,
    issues,
    items: mergedItems,
  }
}

function validateParentReferences(items: Map<string, NavItem>, issues: ValidationIssue[]): void {
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function detectCycle(id: string): boolean {
    if (recStack.has(id)) {
      return true
    }
    if (visited.has(id)) {
      return false
    }

    visited.add(id)
    recStack.add(id)

    const item = items.get(id)
    if (item?.parent) {
      if (item.parent === id) {
        issues.push({
          severity: 'error',
          code: 'SELF_PARENT',
          message: `NavItem "${id}" has self as parent`,
          navId: id,
        })
        return true
      }

      if (detectCycle(item.parent)) {
        issues.push({
          severity: 'error',
          code: 'PARENT_CYCLE',
          message: `Cycle detected in parent chain for "${id}"`,
          navId: id,
        })
        return true
      }
    }

    recStack.delete(id)
    return false
  }

  for (const id of items.keys()) {
    if (!visited.has(id)) {
      detectCycle(id)
    }
  }

  for (const [id, item] of items) {
    if (item.parent && !items.has(item.parent)) {
      issues.push({
        severity: 'warning',
        code: 'NONEXISTENT_PARENT',
        message: `NavItem "${id}" references non-existent parent "${item.parent}"`,
        navId: id,
        details: { parent: item.parent },
      })
    }
  }
}

function validateSections(items: Map<string, NavItem>, issues: ValidationIssue[]): void {
  const definedSections = new Set(['catalog', 'sales', 'customers', 'settings', MISC_SECTION])

  for (const [id, item] of items) {
    if (item.section && !definedSections.has(item.section)) {
      issues.push({
        severity: 'warning',
        code: 'NONEXISTENT_SECTION',
        message: `NavItem "${id}" references non-existent section "${item.section}"`,
        navId: id,
        details: { section: item.section },
      })
    }

    if (item.parent && item.section) {
      issues.push({
        severity: 'warning',
        code: 'BOTH_PARENT_AND_SECTION',
        message: `NavItem "${id}" has both parent and section. Using parent="${item.parent}", ignoring section="${item.section}"`,
        navId: id,
      })
    }
  }
}

function validateNestingDepth(items: Map<string, NavItem>, issues: ValidationIssue[]): void {
  function getDepth(id: string, visited = new Set<string>()): number {
    if (visited.has(id)) return 0
    visited.add(id)

    const item = items.get(id)
    if (!item?.parent) return 1

    return 1 + getDepth(item.parent, visited)
  }

  for (const [id, item] of items) {
    if (item.parent) {
      const depth = getDepth(id)
      if (depth > MAX_NESTING_DEPTH) {
        issues.push({
          severity: 'warning',
          code: 'DEEP_NESTING',
          message: `NavItem "${id}" has deep nesting (${depth} levels > ${MAX_NESTING_DEPTH})`,
          navId: id,
          details: { depth },
        })
      }
    }
  }
}

function validateDynamicRoutes(items: Map<string, NavItem>, issues: ValidationIssue[]): void {
  for (const [id, item] of items) {
    if (!item.path) continue

    const isDynamic = item.path.includes(':') || item.path.includes('*')
    if (isDynamic && item.hidden === false) {
      issues.push({
        severity: 'warning',
        code: 'DYNAMIC_ROUTE_NOT_HIDDEN',
        message: `NavItem "${id}" is dynamic route but hidden=false. Path "${item.path}" will appear in sidebar (likely bad UX)`,
        navId: id,
        details: { path: item.path },
      })
    }

    if (isDynamic && item.hidden === undefined) {
      item.hidden = true
    }
  }
}

function validatePaths(
  items: Map<string, NavItem>,
  availableRoutes: Set<string>,
  issues: ValidationIssue[]
): void {
  for (const [id, item] of items) {
    if (item.path && availableRoutes.size > 0 && !availableRoutes.has(item.path)) {
      issues.push({
        severity: 'warning',
        code: 'UNRESOLVABLE_PATH',
        message: `NavItem "${id}" has path "${item.path}" but no matching route found`,
        navId: id,
        details: { path: item.path },
      })
    }
  }
}

function validateLabels(items: Map<string, NavItem>, issues: ValidationIssue[]): void {
  for (const [id, item] of items) {
    if (!item.label && !item.labelKey) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_LABEL',
        message: `NavItem "${id}" missing label/labelKey. Using id "${id}" as fallback`,
        navId: id,
      })
    }
  }
}

function applyFallbacks(items: Map<string, NavItem>, issues: ValidationIssue[]): void {
  for (const [id, item] of items) {
    if (item.parent && !items.has(item.parent)) {
      if (item.section) {
        delete item.parent
      } else {
        delete item.parent
        item.section = MISC_SECTION
      }
    }

    if (!item.parent && !item.section) {
      item.section = MISC_SECTION
    }

    if (item.parent && item.section) {
      delete item.section
    }

    const sectionExists = ['catalog', 'sales', 'customers', 'settings', MISC_SECTION].includes(item.section || '')
    if (item.section && !sectionExists) {
      item.section = MISC_SECTION
    }
  }
}

export function logValidationIssues(issues: ValidationIssue[]): void {
  if (issues.length === 0) {
    console.log('[mercur-navigation] ✓ All navigation items validated successfully')
    return
  }

  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  const infos = issues.filter(i => i.severity === 'info')

  if (errors.length > 0) {
    console.error(`[mercur-navigation] ✗ ${errors.length} error(s):`)
    for (const issue of errors) {
      console.error(`  [${issue.code}] ${issue.message}`)
    }
  }

  if (warnings.length > 0) {
    console.warn(`[mercur-navigation] ⚠ ${warnings.length} warning(s):`)
    for (const issue of warnings) {
      console.warn(`  [${issue.code}] ${issue.message}`)
    }
  }

  if (infos.length > 0) {
    console.info(`[mercur-navigation] ℹ ${infos.length} info(s):`)
    for (const issue of infos) {
      console.info(`  [${issue.code}] ${issue.message}`)
    }
  }
}
