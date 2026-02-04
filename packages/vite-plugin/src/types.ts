import type { ComponentType, ReactNode } from 'react'
import type { LoaderFunction } from 'react-router-dom'

// ============================================
// Plugin Options
// ============================================

export type MercurAppType = 'admin' | 'vendor'

export interface MercurAppOptions {
  /** Application type */
  type: MercurAppType
  /** User's pages directory (relative to project root) */
  pagesDir?: string
  /** Core package name - defaults based on type */
  corePackage?: string
}

// ============================================
// Route Types
// ============================================

export interface Route {
  /** Route path (e.g., /products/:id) */
  path: string
  /** Absolute file path to the component */
  filePath: string
  /** Source of the route */
  source: 'user' | 'core'
}

/** Exports detected in a page file */
export interface PageExports {
  /** Has export const/function Component */
  hasComponent: boolean
  /** Has export const/function loader */
  hasLoader: boolean
  /** Has export const handle */
  hasHandle: boolean
  /** Has export const/function Breadcrumb */
  hasBreadcrumb: boolean
  /** Has export const isModal = true/false */
  isModal?: boolean
}

/** Extended page info with detected exports */
export interface PageInfo {
  /** Absolute file path */
  filePath: string
  /** Detected exports */
  exports: PageExports
}

export interface ResolvedRoute extends Route {
  /** Layout component file path (if any) */
  layoutPath?: string
  /** Error boundary component file path (if any) */
  errorPath?: string
  /** Detected exports from the page file */
  exports?: PageExports
}

export interface ScannedFiles {
  /** Map of route path -> PageInfo */
  pages: Map<string, PageInfo>
  /** Map of route path -> layout file path */
  layouts: Map<string, string>
  /** Map of route path -> error file path */
  errors: Map<string, string>
}

// ============================================
// Virtual Module Types (for consumers)
// ============================================

export interface RouteHandle {
  breadcrumb?: (match: unknown) => ReactNode | string
  [key: string]: unknown
}

export interface MercurRoute {
  path: string
  Component: ComponentType
  loader?: LoaderFunction
  handle?: RouteHandle
  Breadcrumb?: ComponentType<{ data: unknown }>
  Layout?: ComponentType<{ children: ReactNode }>
  ErrorBoundary?: ComponentType<{ error: Error }>
  /** Whether this route is a modal (renders over parent) */
  isModal?: boolean
}

// ============================================
// Constants
// ============================================

export const VIRTUAL_MODULE_ID = 'virtual:mercur-routes'
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export const VIRTUAL_NAVIGATION_MODULE_ID = 'virtual:mercur-navigation'
export const RESOLVED_VIRTUAL_NAVIGATION_MODULE_ID = '\0' + VIRTUAL_NAVIGATION_MODULE_ID

export const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js']
export const PAGE_GLOB_PATTERN = '**/index.{tsx,ts,jsx,js}'
export const SPECIAL_FILE_GLOB_PATTERN = '**/_*.{tsx,ts,jsx,js}'

export const IGNORED_DIRECTORIES = [
  '**/components/**',
  '**/hooks/**',
  '**/utils/**',
  '**/lib/**',
  '**/helpers/**',
  '**/common/**',
  '**/_*.*',
]

export const SPECIAL_FILES = {
  LAYOUT: '_layout',
  ERROR: '_error',
} as const

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  id: string
  label?: string
  labelKey?: string
  iconKey?: string
  path?: string
  parent?: string
  section?: string
  order?: number
  hidden?: boolean
}

export interface NavSection {
  id: string
  label?: string
  labelKey?: string
  order?: number
}

export interface NavExports {
  hasNav: boolean
  nav?: NavItem
}

export interface PageInfoWithNav extends PageInfo {
  navExports?: NavExports
}

export interface ScannedNavigation {
  items: Map<string, NavItem>
  sections: Map<string, NavSection>
}
