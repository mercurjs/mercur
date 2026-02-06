import path from 'path'
import fs from 'fs'
import { glob } from 'glob'
import {
  PAGE_GLOB_PATTERN,
  SPECIAL_FILE_GLOB_PATTERN,
  IGNORED_DIRECTORIES,
  type ScannedFiles,
} from './types'
import {
  filePathToRoutePath,
  getSpecialFileType,
  getDirectoryRoutePath,
} from './resolver'

/**
 * Scan directory for page files
 * Returns a map of route path -> absolute file path
 */
export async function scanPages(dir: string): Promise<Map<string, string>> {
  const pages = new Map<string, string>()

  if (!fs.existsSync(dir)) {
    return pages
  }

  const files = await glob(PAGE_GLOB_PATTERN, {
    cwd: dir,
    ignore: IGNORED_DIRECTORIES,
  })

  for (const file of files) {
    const routePath = filePathToRoutePath(file)
    const absolutePath = path.join(dir, file)
    pages.set(routePath, absolutePath)
  }

  return pages
}

/**
 * Scan directory for special files (_layout, _error)
 * Returns maps of route path -> absolute file path for each type
 */
export async function scanSpecialFiles(dir: string): Promise<{
  layouts: Map<string, string>
  errors: Map<string, string>
}> {
  const layouts = new Map<string, string>()
  const errors = new Map<string, string>()

  if (!fs.existsSync(dir)) {
    return { layouts, errors }
  }

  const files = await glob(SPECIAL_FILE_GLOB_PATTERN, { cwd: dir })

  for (const file of files) {
    const absolutePath = path.join(dir, file)
    const routePath = getDirectoryRoutePath(file)
    const fileType = getSpecialFileType(file)

    if (fileType === 'layout') {
      layouts.set(routePath, absolutePath)
    } else if (fileType === 'error') {
      errors.set(routePath, absolutePath)
    }
  }

  return { layouts, errors }
}

/**
 * Scan a directory for all files (pages, layouts, errors)
 */
export async function scanDirectory(dir: string): Promise<ScannedFiles> {
  const [pages, { layouts, errors }] = await Promise.all([
    scanPages(dir),
    scanSpecialFiles(dir),
  ])

  return { pages, layouts, errors }
}

/**
 * Merge two ScannedFiles objects
 * Second argument (override) takes priority
 */
export function mergeScannedFiles(
  base: ScannedFiles,
  override: ScannedFiles
): ScannedFiles {
  return {
    pages: new Map([...base.pages, ...override.pages]),
    layouts: new Map([...base.layouts, ...override.layouts]),
    errors: new Map([...base.errors, ...override.errors]),
  }
}
