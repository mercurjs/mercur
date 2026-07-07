/**
 * Generates `src/extension-targets.d.ts` from the panel's own built-in host
 * usages, so extension authors get typed target ids without a hand-maintained
 * list. It scans:
 *
 *   - `<WidgetZone id="…">` usages           → WidgetZoneRegistry (+ placement suffixes)
 *   - `useCoreRoutes()` `to:` literals        → NavItemRegistry / NavParentRegistry
 *   - `<FormExtensionZone model zone>` /       → CustomFieldsRegistry (form/display zones)
 *     `<DisplayExtensionZone model zone>`
 *
 * A zone that no page renders as a host can never be targeted and never enters
 * the types. This runs after `tsup` in the package `build`: it writes the source
 * declaration and, when `dist` exists, ships it there (tsup's own dts build would
 * otherwise prune a standalone augmentation not imported by an entry). Mirrors the
 * CLI route codegen's crawl→template→write shape.
 */
import fs from "fs"
import path from "path"

const SRC = path.join(import.meta.dir ?? __dirname, "..", "src")
const OUT = path.join(SRC, "extension-targets.d.ts")
const PLACEMENTS = ["before", "after"] as const

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
      out.push(full)
  }
  return out
}

function collectWidgetSlots(files: string[]): Set<string> {
  const slots = new Set<string>()
  const re = /<WidgetZone[^>]*\bid=["'`]([^"'`]+)["'`]/g
  for (const file of files) {
    const code = fs.readFileSync(file, "utf-8")
    let m: RegExpExecArray | null
    while ((m = re.exec(code))) slots.add(m[1])
  }
  return slots
}

/**
 * Extract the `useCoreRoutes` return array and derive nav ids from `to:`
 * literals, using bracket depth to separate top-level items (parents) from
 * their nested `items:` children.
 */
function collectNav(mainLayout: string): { items: Set<string>; parents: Set<string> } {
  const items = new Set<string>()
  const parents = new Set<string>()
  const raw = fs.readFileSync(mainLayout, "utf-8")
  const code = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
  const start = code.indexOf("useCoreRoutes")
  if (start === -1) return { items, parents }

  const body = code.slice(start)
  let insideItems = 0 // how many enclosing `items:` arrays we are within

  const stack: ("items" | "other")[] = []
  const re = /(items:\s*\[)|(\])|(\[)|(to:\s*["'`](\/[^"'`]+)["'`])/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    if (m[1]) {
      stack.push("items")
      insideItems++
    } else if (m[3]) {
      stack.push("other")
    } else if (m[2]) {
      if (stack.pop() === "items") insideItems--
    } else if (m[4]) {
      const id = m[5].replace(/^\//, "")
      items.add(id)
      if (insideItems === 0) parents.add(id)
    }
    // Stop after the first top-level function return closes out.
    if (stack.length === 0 && m[2] && items.size > 0) break
  }

  return { items, parents }
}

type ModelZones = {
  formZones: Set<string>
  displayZones: Set<string>
  // built-in overridable field ids per display zone (from <DisplayField> hosts)
  displayFieldIds: Map<string, Set<string>>
  // TabbedForm tab ids per form zone (from <TabbedForm model zone> hosts +
  // sibling `defineTabMeta({ id })` tab modules)
  formTabs: Map<string, Set<string>>
}

// A <TabbedForm model zone> host anchors every `defineTabMeta` tab id under its
// folder to a registry model + form zone.
type TabHost = {
  dir: string
  model: string
  zone: string
  // Absolute base paths of the host's relative imports (tab modules live here).
  bases: Set<string>
}

function collectCustomFields(files: string[]): Map<string, ModelZones> {
  const models = new Map<string, ModelZones>()
  const ensure = (model: string): ModelZones => {
    let m = models.get(model)
    if (!m) {
      m = {
        formZones: new Set(),
        displayZones: new Set(),
        displayFieldIds: new Map(),
        formTabs: new Map(),
      }
      models.set(model, m)
    }
    return m
  }
  const attrs = (tag: string) =>
    new RegExp(`<${tag}\\b[^>]*?model=["'\`]([^"'\`]+)["'\`][^>]*?zone=["'\`]([^"'\`]+)["'\`]`, "gs")
  // <DisplayField model=… zone=… id=…> — captures the built-in field id
  const fieldRe =
    /<DisplayField\b[^>]*?model=["'`]([^"'`]+)["'`][^>]*?zone=["'`]([^"'`]+)["'`][^>]*?id=["'`]([^"'`]+)["'`]/gs
  // <TabbedForm …> opening tag; model/zone pulled out separately (any order).
  const tabbedFormRe = /<TabbedForm\b[^>]*>/gs
  const attrRe = (name: string) =>
    new RegExp(`\\b${name}=["'\`]([^"'\`]+)["'\`]`)
  // `defineTabMeta<…>({ id: "…" })` — captures the tab id. Requires the call
  // form so a bare `import { defineTabMeta }` doesn't match a later column id.
  const tabIdRe =
    /defineTabMeta\b\s*(?:<[^>]*>)?\s*\(\s*\{[\s\S]*?\bid:\s*["'`]([^"'`]+)["'`]/g
  // Relative import specifiers, used to follow a host to its tab modules.
  const importRe = /\bfrom\s+["'](\.[^"']+)["']/g

  const hosts: TabHost[] = []
  const tabIdsByFile = new Map<string, Set<string>>()

  for (const file of files) {
    const code = fs.readFileSync(file, "utf-8")
    let m: RegExpExecArray | null
    const formRe = attrs("FormExtensionZone")
    while ((m = formRe.exec(code))) ensure(m[1]).formZones.add(m[2])
    const dispRe = attrs("DisplayExtensionZone")
    while ((m = dispRe.exec(code))) ensure(m[1]).displayZones.add(m[2])
    while ((m = fieldRe.exec(code))) {
      const model = ensure(m[1])
      model.displayZones.add(m[2])
      let ids = model.displayFieldIds.get(m[2])
      if (!ids) {
        ids = new Set()
        model.displayFieldIds.set(m[2], ids)
      }
      ids.add(m[3])
    }
    while ((m = tabbedFormRe.exec(code))) {
      const tag = m[0]
      const model = attrRe("model").exec(tag)?.[1]
      const zone = attrRe("zone").exec(tag)?.[1]
      if (model && zone) {
        ensure(model).formZones.add(zone)
        const bases = new Set<string>()
        let i: RegExpExecArray | null
        importRe.lastIndex = 0
        while ((i = importRe.exec(code)))
          bases.add(path.resolve(path.dirname(file), i[1]))
        hosts.push({ dir: path.dirname(file), model, zone, bases })
      }
    }
    const tabIds = new Set<string>()
    while ((m = tabIdRe.exec(code))) {
      // Skip dynamically-built ids (template literals) — not real tab names.
      if (!m[1].includes("${")) tabIds.add(m[1])
    }
    if (tabIds.size) tabIdsByFile.set(file, tabIds)
  }

  // Bind each tab module's ids to the host that imports it (its own folder, or a
  // sibling folder reached via a relative import from the host).
  const stripExt = (f: string) => f.replace(/\.(tsx|ts|jsx|js)$/, "")
  for (const [file, ids] of tabIdsByFile) {
    let best: TabHost | undefined
    for (const host of hosts) {
      const inHostDir = file === host.dir || file.startsWith(host.dir + path.sep)
      const imported = [...host.bases].some(
        (base) => stripExt(file) === base || file.startsWith(base + path.sep)
      )
      if ((inHostDir || imported) && (!best || host.dir.length > best.dir.length))
        best = host
    }
    if (!best) continue
    const model = ensure(best.model)
    let zoneTabs = model.formTabs.get(best.zone)
    if (!zoneTabs) {
      zoneTabs = new Set()
      model.formTabs.set(best.zone, zoneTabs)
    }
    for (const id of ids) zoneTabs.add(id)
  }

  return models
}

function union(values: Set<string>): string {
  const list = [...values].sort()
  return list.length ? list.map((v) => JSON.stringify(v)).join(" | ") : "never"
}

// Per-zone tab-id map, e.g. `{ "create": "details" | "organize" }`. Falls back
// to `Record<string, string>` when no zone has scanned tabs, so models without
// tabbed forms keep a permissive tab type.
function formTabsType(formTabs: Map<string, Set<string>>): string {
  const zones = [...formTabs.entries()].filter(([, ids]) => ids.size > 0)
  if (!zones.length) return "Record<string, string>"
  const body = zones
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zone, ids]) => `${JSON.stringify(zone)}: ${union(ids)}`)
    .join("; ")
  return `{ ${body} }`
}

function customFieldsBlock(models: Map<string, ModelZones>): string {
  if (models.size === 0) {
    return "  interface CustomFieldsRegistry {}"
  }
  const entries = [...models.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([model, z]) => {
      const allFieldIds = new Set<string>()
      for (const ids of z.displayFieldIds.values())
        for (const id of ids) allFieldIds.add(id)
      return `    ${JSON.stringify(model)}: {
      formZones: ${union(z.formZones)}
      formTabs: ${formTabsType(z.formTabs)}
      displayZones: ${union(z.displayZones)}
      displayFieldIds: ${union(allFieldIds)}
    }`
    })
    .join("\n")
  return `  interface CustomFieldsRegistry {\n${entries}\n  }`
}

function keys(values: Iterable<string>): string {
  const list = [...values].sort()
  return list.map((v) => `    ${JSON.stringify(v)}: true`).join("\n")
}

function main() {
  const files = walk(SRC)
  const slots = collectWidgetSlots(files)
  const zoneIds = new Set<string>()
  for (const slot of slots) {
    for (const p of PLACEMENTS) zoneIds.add(`${slot}.${p}`)
  }

  const mainLayout = path.join(
    SRC,
    "components",
    "layout",
    "main-layout",
    "main-layout.tsx"
  )
  const nav = fs.existsSync(mainLayout)
    ? collectNav(mainLayout)
    : { items: new Set<string>(), parents: new Set<string>() }

  const models = collectCustomFields(files)

  const contents = `// GENERATED by scripts/generate-extension-targets.ts — do not edit by hand.
// Seeds the built-in extension target ids from this panel's host usages.
import "@mercurjs/dashboard-sdk"

declare module "@mercurjs/dashboard-sdk" {
  interface WidgetZoneRegistry {
${keys(zoneIds)}
  }

  interface NavItemRegistry {
${keys(nav.items)}
  }

  interface NavParentRegistry {
${keys(nav.parents)}
  }

${customFieldsBlock(models)}
}
`

  fs.writeFileSync(OUT, contents)

  // Ship to dist when it exists (i.e. running after `tsup`), so the shipped
  // `@mercurjs/<panel>/extension-targets` entry resolves to the fresh declaration.
  const distDir = path.join(SRC, "..", "dist")
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(OUT, path.join(distDir, "extension-targets.d.ts"))
    fs.writeFileSync(path.join(distDir, "extension-targets.js"), "export {}\n")
  }

  console.log(
    `extension-targets.d.ts: ${zoneIds.size} widget zones, ${nav.items.size} nav items, ${nav.parents.size} nav parents, ${models.size} custom-field models`
  )
}

main()
