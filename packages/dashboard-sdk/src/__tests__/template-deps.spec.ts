import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"
import { DEDUPED_DEPENDENCIES } from "../constants"

type PackageJson = {
  dependencies?: Record<string, string>
}

const repoRoot = path.resolve(__dirname, "../../../..")

const readPackageJson = (relativePath: string): PackageJson =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"))

const template = readPackageJson("templates/basic/package.json")
const dashboardShared = readPackageJson("packages/dashboard-shared/package.json")

describe("basic template dependencies", () => {
  test.each(DEDUPED_DEPENDENCIES)("declares deduped dependency %s at the project root", (name) => {
    expect(template.dependencies?.[name]).toBeDefined()
  })

  test.each(
    DEDUPED_DEPENDENCIES.filter((name) => dashboardShared.dependencies?.[name])
  )("pins %s to the version dashboard-shared is built against", (name) => {
    expect(template.dependencies?.[name]).toBe(dashboardShared.dependencies?.[name])
  })
})
