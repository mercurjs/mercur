import fs from "fs"
import path from "path"

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
      /export\s*\{[^}]*\bAUTHENTICATE\b[^}]*\}/.test(content)
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

export function scanUnauthenticatedRoutes(vendorDir: string): RegExp[] {
  const apiDir = path.dirname(vendorDir)
  const routeFiles = crawlRoutes(vendorDir)
  const patterns: RegExp[] = []

  for (const file of routeFiles) {
    if (hasAuthenticateFalse(file)) {
      patterns.push(filePathToRegex(file, apiDir))
    }
  }

  return patterns
}
