import type { ComponentType, ReactNode } from "react"

export const CORE_LAYOUT_IDS = {
    SINGLE_COLUMN: "core:single-column",
    TWO_COLUMN: "core:two-column",
} as const

export type LayoutSection = {
    id: string
}

/**
 * Maps each layout id to the union of section names it renders, so a page's
 * `sections` prop is checked against the layout it picked. A plugin layout
 * registers its sections by augmenting this interface:
 *
 * @example
 * declare module "@mercurjs/dashboard-sdk" {
 *   interface LayoutSectionRegistry {
 *     "erp:three-column": "main" | "left" | "right"
 *   }
 * }
 */
export interface LayoutSectionRegistry {
    [CORE_LAYOUT_IDS.SINGLE_COLUMN]: "main"
    [CORE_LAYOUT_IDS.TWO_COLUMN]: "main" | "side"
}

export type Layouts = keyof LayoutSectionRegistry

export type SectionNameFor<TLayoutId extends Layouts> =
    LayoutSectionRegistry[TLayoutId]

export type LayoutComponentProps = {
    sections: Record<string, ReactNode>
    data?: unknown
    className?: string
}

export type LayoutConfig = {
    /** Namespaced id, e.g. `erp:three-column`. `core:` is reserved. */
    id: string
    sections: LayoutSection[]
    Component: ComponentType<LayoutComponentProps>
}

/**
 * Entry ids a page exposes: `core:<Entry id>` for its own sections,
 * `widget:<widget id>` for injected widgets, `nav:<path>` for sidebar items.
 * Panels seed the built-in ids through `extension-targets`.
 */
export interface LayoutEntryRegistry {}

export type LayoutEntryId = keyof LayoutEntryRegistry extends never
    ? string
    : keyof LayoutEntryRegistry

export type EntryPreference = {
    hidden?: boolean
    /** Move the entry to another section of the page's layout. */
    section?: string
    /** Sort order within the section; entries without one keep source order at 0. */
    order?: number
    /** Sidebar entries only: i18n key or literal replacing the label. */
    label?: string
    /** Sidebar entries only: icon component replacing the icon. */
    icon?: ComponentType
    /** Sidebar entries only: re-parent under another item, `null` promotes to top level. */
    parent?: string | null
}

export type NavGroupPreference = {
    id: string
    label?: string
    translationNs?: string
    rank?: number
    hidden?: boolean
}

export type ZonePreference = {
    entries?: Record<string, EntryPreference>
    /** Sidebar zones (`nav.main`, `nav.settings`) only. */
    groups?: NavGroupPreference[]
}

/**
 * Code-level layout preferences, one object per zone prefix. Declared in a
 * layer's `_layouts.ts`; later layers override earlier ones field by field.
 */
export type LayoutPreferences = Record<string, ZonePreference>

export const NAV_ZONES = {
    MAIN: "nav.main",
    SETTINGS: "nav.settings",
} as const

export type GateConfig = {
    id: string
    /** Lower renders outermost. */
    order?: number
}
