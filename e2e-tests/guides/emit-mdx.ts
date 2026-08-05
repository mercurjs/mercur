import { mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import type { GuideDefinition } from "./define-guide"
import type { RenderedStep } from "./driver"
import { GUIDE_MDX_ROOT } from "./paths"

// Mintlify frontmatter uses double-quoted strings, so escape backslashes first
// (a `\` in the input must not be left to combine with an escaped quote) and
// then the quotes themselves.
function frontmatterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function renderStep(step: RenderedStep): string {
  const lines: string[] = [`  <Step title="${frontmatterValue(step.title)}">`]
  if (step.body) {
    lines.push(`    ${step.body.trim()}`)
  }
  if (step.imageSrc) {
    lines.push(
      `    <Frame>`,
      `      <img src="${step.imageSrc}" alt="${frontmatterValue(step.title)}" />`,
      `    </Frame>`
    )
  }
  lines.push(`  </Step>`)
  return lines.join("\n")
}

// Builds the Mintlify MDX for a guide following the docs voice conventions:
// double-quoted frontmatter, an optional intro paragraph, then a <Steps> block
// with one <Step> per captured step. Output is deterministic so regenerating a
// guide produces a clean diff.
export function renderGuideMdx(
  guide: GuideDefinition,
  steps: RenderedStep[]
): string {
  const frontmatter = [
    "---",
    `title: "${frontmatterValue(guide.title)}"`,
    ...(guide.description
      ? [`description: "${frontmatterValue(guide.description)}"`]
      : []),
    "---",
  ]

  const body: string[] = []
  if (guide.intro) {
    body.push("", guide.intro.trim())
  }
  body.push("", "<Steps>", steps.map(renderStep).join("\n"), "</Steps>", "")

  return [...frontmatter, ...body].join("\n")
}

// Writes the guide MDX to apps/docs/user-guide/<panel>/[<dir>/]<slug>.mdx and
// returns the absolute path written.
export function writeGuideMdx(
  guide: GuideDefinition,
  steps: RenderedStep[]
): string {
  const dir = resolve(GUIDE_MDX_ROOT, guide.panel, guide.dir ?? "")
  mkdirSync(dir, { recursive: true })
  const filePath = resolve(dir, `${guide.slug}.mdx`)
  writeFileSync(filePath, renderGuideMdx(guide, steps))
  return filePath
}
