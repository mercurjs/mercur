export type Hunk = {
  /** Context + removed lines: what the file must contain for the hunk to apply. */
  before: string[]
  /** Context + added lines: what replaces it. */
  after: string[]
  /** 1-based line the hunk was generated at, used as the first place to look. */
  oldStart: number
}

export type FilePatch = {
  /** Path relative to the package root. */
  path: string
  hunks: Hunk[]
}

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@/

function stripPrefix(path: string): string {
  return path.replace(/^[ab]\//, "").trim()
}

/**
 * Parses the subset of unified diff that `git diff --no-index` emits for text
 * files: file headers, hunk headers, and ` `/`-`/`+` body lines. Anything else
 * (rename, mode, binary) is unsupported on purpose — patches here are expected
 * to be small edits to shipped JavaScript.
 */
export function parseUnifiedDiff(patch: string): FilePatch[] {
  const files: FilePatch[] = []
  const lines = patch.split("\n")

  let current: FilePatch | null = null
  let hunk: Hunk | null = null

  const closeHunk = () => {
    if (current && hunk) current.hunks.push(hunk)
    hunk = null
  }

  for (const line of lines) {
    if (line.startsWith("+++ ")) {
      closeHunk()
      const path = stripPrefix(line.slice(4))
      if (path === "/dev/null") {
        throw new Error("Unified diff deletes a file, which is not supported")
      }
      current = { path, hunks: [] }
      files.push(current)
      continue
    }

    if (line.startsWith("--- ") || line.startsWith("diff --git ")) {
      closeHunk()
      continue
    }

    const header = HUNK_HEADER.exec(line)
    if (header) {
      closeHunk()
      hunk = { before: [], after: [], oldStart: Number.parseInt(header[1], 10) }
      continue
    }

    if (!hunk) continue

    const marker = line[0]
    const content = line.slice(1)

    if (marker === " ") {
      hunk.before.push(content)
      hunk.after.push(content)
    } else if (marker === "-") {
      hunk.before.push(content)
    } else if (marker === "+") {
      hunk.after.push(content)
    }
    // "\ No newline at end of file" and blank separators are ignored.
  }

  closeHunk()

  return files.filter((file) => file.hunks.length)
}

function matchesAt(source: string[], block: string[], at: number): boolean {
  if (at < 0 || at + block.length > source.length) return false
  return block.every((line, i) => source[at + i] === line)
}

/**
 * How far from the recorded line a hunk may drift and still be considered the
 * same code. Unbounded searching is unsafe: the same few lines of context can
 * legitimately appear elsewhere in a file — cartFieldsForRefreshSteps and
 * completeCartFields share several — and relocating a hunk that far would
 * silently patch the wrong site.
 */
const MAX_DRIFT_LINES = 50

/**
 * Locates a hunk by content, preferring the line it was generated at and
 * otherwise accepting a single unambiguous match nearby. Returns -1 when the
 * hunk does not apply, or could apply in more than one place — both mean the
 * patch is stale and must be regenerated rather than guessed at.
 */
function locate(source: string[], block: string[], oldStart: number): number {
  if (!block.length) return -1

  const expected = oldStart - 1
  if (matchesAt(source, block, expected)) return expected

  const from = Math.max(0, expected - MAX_DRIFT_LINES)
  const to = Math.min(source.length - block.length, expected + MAX_DRIFT_LINES)

  let found = -1
  for (let i = from; i <= to; i++) {
    if (!matchesAt(source, block, i)) continue
    if (found !== -1) return -1
    found = i
  }

  return found
}

/**
 * Applies every hunk, or returns `null`. A patch is never partially applied.
 */
export function applyHunks(source: string, hunks: Hunk[]): string | null {
  let lines = source.split("\n")

  for (const hunk of hunks) {
    const at = locate(lines, hunk.before, hunk.oldStart)
    if (at === -1) return null

    lines = [
      ...lines.slice(0, at),
      ...hunk.after,
      ...lines.slice(at + hunk.before.length),
    ]
  }

  return lines.join("\n")
}

export function reverse(hunks: Hunk[]): Hunk[] {
  return hunks.map((hunk) => ({
    before: hunk.after,
    after: hunk.before,
    oldStart: hunk.oldStart,
  }))
}
