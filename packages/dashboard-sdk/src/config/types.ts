import type { ComponentType } from "react"

/**
 * Open registry interfaces. Each panel package ships a generated
 * `extension-targets.d.ts` that seeds the built-in ids into these interfaces
 * (declaration merging), and a developer augments them by hand to register a
 * zone their own page renders. The helper unions read off the interface keys.
 *
 * @example
 * declare module "@mercurjs/dashboard-sdk" {
 *   interface WidgetZoneRegistry {
 *     "erp.dashboard.before": true
 *   }
 * }
 */
export interface WidgetZoneRegistry {}
export interface NavItemRegistry {}
export interface NavParentRegistry {}

export type WidgetZoneId = keyof WidgetZoneRegistry extends never
    ? string
    : keyof WidgetZoneRegistry

export type NavItemId = keyof NavItemRegistry extends never
    ? string
    : keyof NavItemRegistry

export type NavParentId = keyof NavParentRegistry extends never
    ? string
    : keyof NavParentRegistry

/**
 * A widget is a React component attached to a named zone on a page. The
 * placement (`before | after`) is encoded as the zone-id suffix, so there is no
 * separate rank field — multiple `before`/`after` widgets stack in registration
 * order.
 */
export interface WidgetConfig {
    zone: WidgetZoneId | WidgetZoneId[]
    /** Stable id; derived from the file path at build time when omitted. */
    id?: string
}

/** Override for a single built-in navigation item. */
export interface NavItemOverride {
    id: NavItemId
    /** Order within the item's parent (or among top-level items). */
    rank?: number
    /** Remove from the sidebar (route may still be reachable directly). */
    hidden?: boolean
    /** i18n key or literal replacing the item's label. */
    label?: string
    /** Icon component replacing the item's icon. */
    icon?: ComponentType
    /**
     * Re-parent the item: a built-in parent id moves it under that parent's
     * children; `null` promotes a nested item to the top level.
     */
    nested?: NavParentId | null
}

export interface NavigationConfig {
    items: NavItemOverride[]
}
