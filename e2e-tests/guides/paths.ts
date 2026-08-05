import { resolve } from "path"
import { E2E_ROOT } from "../src/stack/paths"

// apps/docs is a sibling of e2e-tests at the repo root.
export const REPO_ROOT = resolve(E2E_ROOT, "..")
export const DOCS_ROOT = resolve(REPO_ROOT, "apps", "docs")

// Generated MDX lands in the User Guide tab; screenshots under the docs image
// root so Mintlify serves them at /images/user-guide/<panel>/<slug>/step-N.png.
export const GUIDE_MDX_ROOT = resolve(DOCS_ROOT, "user-guide")
export const GUIDE_IMAGE_ROOT = resolve(DOCS_ROOT, "images", "user-guide")

// Public URL (as referenced from an MDX <img src>) for a guide's image folder.
// Where guide-seed.ts stashes the publishable key + customer token so
// global-setup can drive a store checkout over HTTP after the server is up.
export const ORDER_SEED_FILE = resolve(E2E_ROOT, ".order-seed.json")

export function guideImageUrlDir(panel: string, slug: string): string {
  return `/images/user-guide/${panel}/${slug}`
}
