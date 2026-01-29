import type { ComponentType, ReactNode } from 'react'

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

export interface ResolvedRoute extends Route {
  /** Layout component file path (if any) */
  layoutPath?: string
  /** Error boundary component file path (if any) */
  errorPath?: string
}

export interface ScannedFiles {
  pages: Map<string, string>
  layouts: Map<string, string>
  errors: Map<string, string>
}

// ============================================
// Virtual Module Types (for consumers)
// ============================================

export interface MercurRoute {
  path: string
  Component: ComponentType
  Layout?: ComponentType<{ children: ReactNode }>
  ErrorBoundary?: ComponentType<{ error: Error }>
}

// ============================================
// Constants
// ============================================

export const VIRTUAL_MODULE_ID = 'virtual:mercur-routes'
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

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
