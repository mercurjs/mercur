// The guide definition is the single source of truth for a User Guide page.
// One definition drives Playwright through the real panel, captures screenshots,
// and emits the Mintlify MDX. If a selector breaks, generation fails loudly,
// which doubles as a UI regression signal. See guides/README.md.

export type DashboardArea = "admin" | "vendor"

// How to locate an element on the page. Prefer `testid` — the UI-ARCHITECTURE
// contract puts a data-testid on every interactive element, so it is the most
// stable selector and survives styling changes.
export type Target =
  | { testid: string }
  | { role: string; name?: string | RegExp }
  | { label: string }
  | { placeholder: string }
  | { text: string }
  | { css: string }

// What to capture for a step. Omit `shot` to reuse the default (full page);
// set it to `false` for an action-only step with no image.
export type ShotSpec = "full" | "viewport" | { element: Target }

export interface GuideStep {
  // Rendered as <Step title="...">.
  title: string
  // Optional markdown shown inside the step, above the screenshot.
  body?: string

  // Actions run in order before the screenshot is taken.
  goto?: string // path relative to the panel base URL, e.g. "/settings/commissions"
  waitFor?: Target // wait for this element to be visible before acting/shooting
  fill?: Array<{ target: Target; value: string }>
  select?: { target: Target; option: string }
  click?: Target
  press?: string // a keyboard key, e.g. "Enter"

  // Grey out dynamic or personal regions (dates, ids, emails) so screenshots
  // stay diff-stable and free of PII.
  mask?: Target[]
  // Outline the element being acted on so the reader's eye lands on it.
  highlight?: Target

  shot?: ShotSpec | false
}

export interface GuideDefinition {
  // kebab-case; becomes the MDX filename and the image folder name.
  slug: string
  panel: DashboardArea
  // Optional nested subpath under user-guide/<panel>/ for the emitted MDX, e.g.
  // "commissions/how-tos" writes user-guide/admin/commissions/how-tos/<slug>.mdx.
  // Omit for a flat page directly under the panel. Screenshots stay keyed by
  // slug regardless, so their URLs do not depend on this.
  dir?: string
  // Frontmatter title.
  title: string
  // Frontmatter description (one sentence, no em-dashes).
  description?: string
  // Intro paragraph rendered after the frontmatter, before the steps.
  intro?: string
  // Set true for a public page (login screen, register) that needs no auth.
  public?: boolean
  steps: GuideStep[]
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// One or more kebab segments separated by "/". No leading/trailing slash, no
// "..", so a definition can never write outside the user guide tree.
const DIR_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/

// Typed passthrough with a light runtime guard so a malformed slug fails at
// definition time rather than producing a broken file path.
export function defineGuide(guide: GuideDefinition): GuideDefinition {
  if (!SLUG_RE.test(guide.slug)) {
    throw new Error(
      `Guide slug "${guide.slug}" must be kebab-case (a-z, 0-9, hyphens).`
    )
  }
  if (guide.dir !== undefined && !DIR_RE.test(guide.dir)) {
    throw new Error(
      `Guide "${guide.slug}" dir "${guide.dir}" must be kebab-case path segments separated by "/" (no leading/trailing slash).`
    )
  }
  if (guide.steps.length === 0) {
    throw new Error(`Guide "${guide.slug}" has no steps.`)
  }
  return guide
}
