import { readFileSync } from "fs"
import { test } from "@playwright/test"
import { STACK_STATE_FILE } from "../src/stack/paths"
import { GUIDE_ADMIN, GUIDE_SELLER } from "./credentials"
import { loginToPanel, resetGuideImages, runStep, type RenderedStep } from "./driver"
import { writeGuideMdx } from "./emit-mdx"
import { GUIDES } from "./registry"

interface StackUrls {
  medusa: string
  admin: string
  vendor: string
}

function stackUrls(): StackUrls {
  return JSON.parse(readFileSync(STACK_STATE_FILE, "utf-8"))
}

// One Playwright test per guide. Each drives the real panel end to end, captures
// its screenshots into apps/docs/images, and writes the MDX into
// apps/docs/user-guide. The stack (Medusa + both dashboards, seeded with the
// apps/api demo catalog) is owned by global-setup.guides.ts.
test.describe("generate user guides", () => {
  if (GUIDES.length === 0) {
    // Keep the run green while no guides are registered. Register guides in
    // registry.ts to turn these into real generation tests.
    test.skip("no guides registered yet", () => {})
    return
  }

  for (const guide of GUIDES) {
    test(`${guide.panel}: ${guide.slug}`, async ({ page }) => {
      const urls = stackUrls()
      const baseUrl = urls[guide.panel]

      if (!guide.public) {
        const creds = guide.panel === "admin" ? GUIDE_ADMIN : GUIDE_SELLER
        await loginToPanel(page, baseUrl, creds)
      }

      const imageDir = resetGuideImages(guide.panel, guide.slug)
      const rendered: RenderedStep[] = []
      for (const [index, step] of guide.steps.entries()) {
        rendered.push(
          await runStep(page, baseUrl, guide, step, index, imageDir)
        )
      }

      const written = writeGuideMdx(guide, rendered)
      console.log(`[guides] wrote ${written}`)
    })
  }
})
