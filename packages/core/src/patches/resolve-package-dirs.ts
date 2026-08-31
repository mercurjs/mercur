import { existsSync, readdirSync, readFileSync } from "fs"
import { dirname, join } from "path"
import pkgDir from "pkg-dir"
import resolveCwd from "resolve-cwd"

// A dependency can be present many times in one install, and where the copies
// live depends on the package manager: bun stores them under `node_modules/
// .bun/<name>@<ver>+<hash>/`, pnpm under `node_modules/.pnpm/<name>@<ver>/`,
// npm and yarn hoist to the nearest `node_modules` or nest per-dependency.
// `templates/basic` supports all four, so module-scoped patches have to find
// every copy rather than assume a layout.

function readVersion(dir: string): string | null {
  try {
    const raw = readFileSync(join(dir, "package.json"), "utf8")
    return (JSON.parse(raw) as { version?: string }).version ?? null
  } catch {
    return null
  }
}

function storePrefix(packageName: string, separator: string): string {
  return `${packageName.replace("/", separator)}@`
}

function sweepStore(
  storeDir: string,
  packageName: string,
  separator: string,
  found: Set<string>
): void {
  if (!existsSync(storeDir)) return

  const prefix = storePrefix(packageName, separator)
  for (const entry of readdirSync(storeDir)) {
    if (!entry.startsWith(prefix)) continue
    const inner = join(storeDir, entry, "node_modules", ...packageName.split("/"))
    if (existsSync(join(inner, "package.json"))) found.add(inner)
  }
}

export function resolvePackageDirs(packageName: string): string[] {
  const found = new Set<string>()

  try {
    const entry = resolveCwd(`${packageName}/package.json`)
    const primary = pkgDir.sync(dirname(entry))
    if (primary) found.add(primary)
  } catch {
    // Not resolvable from cwd: the store sweeps below may still find copies.
  }

  let cursor = process.cwd()
  while (true) {
    const nodeModules = join(cursor, "node_modules")
    if (existsSync(nodeModules)) {
      sweepStore(join(nodeModules, ".bun"), packageName, "+", found)
      sweepStore(join(nodeModules, ".pnpm"), packageName, "+", found)

      const hoisted = join(nodeModules, ...packageName.split("/"))
      if (existsSync(join(hoisted, "package.json"))) found.add(hoisted)
    }

    const parent = dirname(cursor)
    if (parent === cursor) break
    cursor = parent
  }

  return [...found]
}

export function readPackageVersion(dir: string): string | null {
  return readVersion(dir)
}
