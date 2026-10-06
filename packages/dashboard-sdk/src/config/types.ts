import type { ComponentType } from "react"
import type { Permission } from "../permissions"

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
export interface NavGroupRegistry {}

export type WidgetZoneId = keyof WidgetZoneRegistry extends never
    ? string
    : keyof WidgetZoneRegistry

export type NavItemId = keyof NavItemRegistry extends never
    ? string
    : keyof NavItemRegistry

export type NavParentId = keyof NavParentRegistry extends never
    ? string
    : keyof NavParentRegistry

export type NavGroupId = keyof NavGroupRegistry extends never
    ? string
    : keyof NavGroupRegistry

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
    /**
     * Permission(s) the actor needs for the widget to render. With several, any
     * one is enough.
     */
    permission?: Permission | Permission[]
    /**
     * i18n key or literal naming the tab. Required for a `*.tabs.*` zone, where
     * the widget renders as a tab's panel; ignored elsewhere.
     */
    label?: string
}

/** Override for a single built-in navigation item. */
export interface NavItemOverride<TGroup extends string = never> {
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
    /**
     * List the item under a group heading: a built-in settings group id or one
     * declared in `groups`. Main sidebar items only join declared groups.
     */
    group?: NavGroupId | TGroup
}

/**
 * Declares a sidebar group, or overrides a built-in settings group by id. A
 * group renders in whichever sidebar its items live in.
 */
export interface NavGroupConfig<TId extends string = string> {
    id: NavGroupId | TId
    /** i18n key (with `translationNs`) or literal. Falls back to the id. */
    label?: string
    translationNs?: string
    /** Order among groups, lower first. Built-in settings groups rank 0, 1, 2… */
    rank?: number
    /** Remove the group and its items from the sidebar. */
    hidden?: boolean
}

export interface NavigationConfig<TGroup extends string = never> {
    groups?: NavGroupConfig<TGroup>[]
    items?: NavItemOverride<NoInfer<TGroup>>[]
}
