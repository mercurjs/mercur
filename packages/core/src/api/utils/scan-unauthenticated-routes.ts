import fs from "fs"
import path from "path"
import type { MedusaRequest } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  getResolvedPlugins,
} from "@medusajs/framework/utils"

const VALID_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"]

function crawlRoutes(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...crawlRoutes(fullPath))
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      const baseName = path.basename(entry.name, ext)

      if (baseName === "route" && VALID_EXTENSIONS.includes(ext)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

function hasAuthenticateFalse(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return (
      /export\s+const\s+AUTHENTICATE\s*=\s*false/.test(content) ||
      /export\s*\{[^}]*\bAUTHENTICATE\b[^}]*\}/.test(content) ||
      // Plugin routes are scanned in their compiled CommonJS output.
      /\bexports\.AUTHENTICATE\s*=\s*false\b/.test(content)
    )
  } catch {
    return false
  }
}

function filePathToRegex(filePath: string, apiDir: string): RegExp {
  const relativePath = path.relative(apiDir, filePath).replace(/\\/g, "/")
  const urlPath = relativePath.replace(/\/route\.(ts|tsx|js|jsx)$/, "")

  const segments = urlPath.split("/")
  const regexSegments = segments.map((segment) => {
    if (/^\[.+\]$/.test(segment)) {
      return "[^/]+"
    }
    return segment
  })

  return new RegExp("^\\/" + regexSegments.join("\\/") + "$")
}

function scanSourceDir(srcDir: string): RegExp[] {
  const apiDir = path.join(srcDir, "api")
  const routeFiles = crawlRoutes(path.join(apiDir, "vendor"))
  const patterns: RegExp[] = []

  for (const file of routeFiles) {
    if (hasAuthenticateFalse(file)) {
      patterns.push(filePathToRegex(file, apiDir))
    }
  }

  return patterns
}

export function scanUnauthenticatedRoutes(projectRoot: string): RegExp[] {
  return scanSourceDir(path.join(projectRoot, "src"))
}

let pluginPatterns: Promise<RegExp[]> | undefined

/**
 * Plugin routes are resolved on the first request: the vendor middlewares are
 * built at import time, before the config module is available.
 */
export const resolvePluginUnauthenticatedRoutes = (
  req: MedusaRequest
): Promise<RegExp[]> => {
  pluginPatterns ??= (async () => {
    const configModule = req.scope.resolve(
      ContainerRegistrationKeys.CONFIG_MODULE
    )
    const plugins = await getResolvedPlugins(process.cwd(), configModule)
    return plugins.flatMap((plugin) => scanSourceDir(plugin.resolve))
  })().catch((error) => {
    pluginPatterns = undefined
    throw error
  })

  return pluginPatterns
}
