import { existsSync, readdirSync, readFileSync, realpathSync } from "fs"
import { dirname, join } from "path"
import pkgDir from "pkg-dir"
import resolveCwd from "resolve-cwd"

// A dependency can be present many times in one install, and where the copies
// live depends on the package manager: bun stores them under `node_modules/
// .bun/<name>@<ver>+<hash>/`, pnpm under `node_modules/.pnpm/<name>@<ver>/`,
// npm and yarn hoist to the nearest `node_modules` or nest per-dependency.
// `templates/basic` supports all four, so patching has to find every copy
// rather than assume a layout.
//
// Those stores are shared across checkouts, so a sweep also turns up copies at
// versions this project never loads. Only the copy the project itself resolves
// is required to accept a patch; the rest are patched opportunistically.

export type PackageCopy = {
  dir: string
  version: string | null
  /** The copy `require()` resolves from the project — the one that must work. */
  primary: boolean
}

function readVersion(dir: string): string | null {
  try {
    const raw = readFileSync(join(dir, "package.json"), "utf8")
    return (JSON.parse(raw) as { version?: string }).version ?? null
  } catch {
    return null
  }
}

function canonical(dir: string): string {
  try {
    return realpathSync(dir)
  } catch {
    return dir
  }
}

function sweepStore(
  storeDir: string,
  packageName: string,
  found: Set<string>
): void {
  if (!existsSync(storeDir)) return

  const prefix = `${packageName.replace("/", "+")}@`
  for (const entry of readdirSync(storeDir)) {
    if (!entry.startsWith(prefix)) continue
    const inner = join(storeDir, entry, "node_modules", ...packageName.split("/"))
    if (existsSync(join(inner, "package.json"))) found.add(canonical(inner))
  }
}

export function resolvePackageCopies(packageName: string): PackageCopy[] {
  let primary: string | null = null

  // Resolve the package entry point, not `<name>/package.json`: packages that
  // declare `exports` without a `./package.json` entry — core-flows is one —
  // make the subpath unresolvable, which would silently leave every copy
  // non-primary and drop the guarantee that the copy this project loads is the
  // one that must accept the patch.
  try {
    const entry = resolveCwd(packageName)
    const resolved = pkgDir.sync(dirname(entry))
    if (resolved) primary = canonical(resolved)
  } catch {
    // Not resolvable from cwd; the sweeps below may still find copies.
  }

  const found = new Set<string>()
  if (primary) found.add(primary)

  let cursor = process.cwd()
  while (true) {
    const nodeModules = join(cursor, "node_modules")
    if (existsSync(nodeModules)) {
      sweepStore(join(nodeModules, ".bun"), packageName, found)
      sweepStore(join(nodeModules, ".pnpm"), packageName, found)

      const hoisted = join(nodeModules, ...packageName.split("/"))
      if (existsSync(join(hoisted, "package.json"))) found.add(canonical(hoisted))
    }

    const parent = dirname(cursor)
    if (parent === cursor) break
    cursor = parent
  }

  return [...found].map((dir) => ({
    dir,
    version: readVersion(dir),
    primary: dir === primary,
  }))
}
