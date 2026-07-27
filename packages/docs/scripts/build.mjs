import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PKG_DIR = path.resolve(__dirname, "..")
// Latest docs live at the root of apps/docs; archived versions sit in
// their own folders and must not be bundled.
const SOURCE_DIR = path.resolve(__dirname, "../../../apps/docs")
const EXCLUDED_TOP_DIRS = new Set(["v1"])
const CONTENT_DIR = path.resolve(PKG_DIR, "content")
const INDEX_FILE = path.resolve(PKG_DIR, "llms.txt")

// First path segment of a doc → the heading it appears under in the index.
const GROUP_LABELS = {
  learn: "Learn — concepts and getting started",
  resources: "Resources — tutorials, integrations, deployment",
  tools: "Tools — CLI, API client, dashboard SDK",
  references: "References — modules, HTTP API, configuration",
  "user-guide": "User Guide — admin and vendor panels",
  migration: "Migration",
}

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
    } else if (entry.name.endsWith(".mdx")) {
      out.push(full)
    }
  }
  return out
}

// Minimal frontmatter reader — the docs only use flat `key: value` frontmatter.
function readFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    return {}
  }
  const meta = {}
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (!kv) {
      continue
    }
    meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "")
  }
  return meta
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Docs source not found at ${SOURCE_DIR}`)
  }

  fs.rmSync(CONTENT_DIR, { recursive: true, force: true })
  fs.mkdirSync(CONTENT_DIR, { recursive: true })

  const files = walk(SOURCE_DIR)
    .filter((file) => {
      const top = path.relative(SOURCE_DIR, file).split(path.sep)[0]
      return !EXCLUDED_TOP_DIRS.has(top)
    })
    .sort()
  const groups = new Map()

  for (const file of files) {
    const rel = path.relative(SOURCE_DIR, file)
    const dest = path.join(CONTENT_DIR, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    const raw = fs.readFileSync(file, "utf8")
    fs.writeFileSync(dest, raw)

    const meta = readFrontmatter(raw)
    const segment = rel.split(path.sep)[0]
    const groupKey = GROUP_LABELS[segment] ? segment : "other"
    const bucket = groups.get(groupKey) ?? []
    bucket.push({
      title: meta.title || rel.replace(/\.mdx$/, ""),
      description: meta.description || "",
      path: `content/${rel.split(path.sep).join("/")}`,
    })
    groups.set(groupKey, bucket)
  }

  const orderedKeys = [...Object.keys(GROUP_LABELS), "other"].filter((k) =>
    groups.has(k)
  )

  const lines = [
    "# Mercur Documentation",
    "",
    "Bundled documentation for the Mercur marketplace framework. AI agents:",
    "read this index, then open the referenced file under `content/` for the",
    "full page before implementing anything. Paths are relative to this",
    "package (`node_modules/@mercurjs/docs/`).",
    "",
  ]

  for (const key of orderedKeys) {
    lines.push(`## ${GROUP_LABELS[key] || "Other"}`, "")
    for (const doc of groups.get(key)) {
      const suffix = doc.description ? ` — ${doc.description}` : ""
      lines.push(`- [${doc.title}](${doc.path})${suffix}`)
    }
    lines.push("")
  }

  fs.writeFileSync(INDEX_FILE, lines.join("\n"))

  const total = files.length
  console.log(`@mercurjs/docs: bundled ${total} pages → content/, wrote llms.txt`)
}

main()
