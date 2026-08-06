import { mkdirSync, rmSync } from "fs"
import { resolve } from "path"
import type { Locator, Page } from "@playwright/test"
import { LoginPage } from "../journeys/pages/login.page"
import type { GuideDefinition, GuideStep, Target } from "./define-guide"
import { GUIDE_IMAGE_ROOT, guideImageUrlDir } from "./paths"

// Resolves a Target descriptor into a Playwright Locator.
export function resolveLocator(page: Page, target: Target): Locator {
  if ("testid" in target) {
    return page.getByTestId(target.testid)
  }
  if ("role" in target) {
    // Playwright's ARIA role union is wide; the guide author owns correctness.
    return page.getByRole(target.role as Parameters<Page["getByRole"]>[0], {
      name: target.name,
    })
  }
  if ("label" in target) {
    return page.getByLabel(target.label)
  }
  if ("placeholder" in target) {
    return page.getByPlaceholder(target.placeholder)
  }
  if ("text" in target) {
    return page.getByText(target.text)
  }
  return page.locator(target.css)
}

export async function loginToPanel(
  page: Page,
  baseUrl: string,
  creds: { email: string; password: string }
): Promise<void> {
  await page.goto(`${baseUrl}/login`)
  const loginPage = new LoginPage(page)
  await loginPage.login(creds.email, creds.password)
  await page.waitForURL((url) => !url.pathname.startsWith("/login"))
}

// Removes any previously generated screenshots for a guide so a shortened or
// re-ordered guide never leaves orphaned step images behind.
export function resetGuideImages(panel: string, slug: string): string {
  const dir = resolve(GUIDE_IMAGE_ROOT, panel, slug)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  return dir
}

export interface RenderedStep {
  title: string
  body?: string
  // Public MDX <img src>, or null when the step took no screenshot.
  imageSrc: string | null
}

// Adds a temporary outline to an element so it stands out in the screenshot,
// then returns a cleanup function that removes it.
async function applyHighlight(locator: Locator): Promise<() => Promise<void>> {
  const handle = await locator.elementHandle()
  if (!handle) {
    return async () => {}
  }
  const previous = await handle.evaluate((el: HTMLElement) => {
    const prev = el.style.outline
    el.style.outline = "3px solid #7C3AED"
    el.style.outlineOffset = "2px"
    el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior })
    return prev
  })
  return async () => {
    await handle.evaluate(
      (el: HTMLElement, prev: string) => {
        el.style.outline = prev
      },
      previous
    )
    await handle.dispose()
  }
}

// Runs one step's actions in order, then captures its screenshot. Returns the
// render data the MDX emitter needs. Throws on any failed action or missing
// element so generation surfaces UI drift instead of producing a wrong guide.
export async function runStep(
  page: Page,
  baseUrl: string,
  guide: GuideDefinition,
  step: GuideStep,
  index: number,
  imageDir: string
): Promise<RenderedStep> {
  if (step.goto) {
    await page.goto(`${baseUrl}${step.goto}`)
  }
  if (step.waitFor) {
    await resolveLocator(page, step.waitFor).waitFor({ state: "visible" })
  }
  for (const entry of step.fill ?? []) {
    await resolveLocator(page, entry.target).fill(entry.value)
  }
  if (step.select) {
    await resolveLocator(page, step.select.target).selectOption(
      step.select.option
    )
  }
  if (step.click) {
    await resolveLocator(page, step.click).click()
  }
  if (step.press) {
    await page.keyboard.press(step.press)
  }

  // Let the panel settle (data fetches, animations) before shooting.
  await page.waitForLoadState("networkidle").catch(() => {})

  const shot = step.shot ?? "full"
  if (shot === false) {
    return { title: step.title, body: step.body, imageSrc: null }
  }

  const cleanups: Array<() => Promise<void>> = []
  if (step.highlight) {
    cleanups.push(await applyHighlight(resolveLocator(page, step.highlight)))
  }

  const fileName = `step-${index + 1}.png`
  const filePath = resolve(imageDir, fileName)
  const mask = (step.mask ?? []).map((t) => resolveLocator(page, t))

  try {
    if (typeof shot === "object" && "element" in shot) {
      await resolveLocator(page, shot.element).screenshot({ path: filePath })
    } else {
      await page.screenshot({
        path: filePath,
        fullPage: shot === "full",
        mask,
      })
    }
  } finally {
    for (const cleanup of cleanups) {
      await cleanup()
    }
  }

  return {
    title: step.title,
    body: step.body,
    imageSrc: `${guideImageUrlDir(guide.panel, guide.slug)}/${fileName}`,
  }
}
