import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, test } from "vitest"
import { generateI18n } from "../i18n"
import type { BuiltMercurConfig } from "../types"

const tmpDirs: string[] = []

const makeDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mercur-i18n-"))
  tmpDirs.push(dir)
  return dir
}

const setup = async ({
  app,
  plugins = [],
}: {
  app?: Record<string, unknown>
  plugins?: Record<string, unknown>[]
}) => {
  const root = makeDir()
  const srcDir = path.join(root, "src")
  fs.mkdirSync(srcDir)

  if (app) {
    fs.mkdirSync(path.join(srcDir, "i18n"))
    fs.writeFileSync(
      path.join(srcDir, "i18n", "index.ts"),
      `export default ${JSON.stringify(app)}`
    )
  }

  const pluginExtensions = plugins.map((i18nModule, i) => {
    const file = path.join(root, `plugin-${i}.ts`)
    fs.writeFileSync(file, `export default { i18nModule: ${JSON.stringify(i18nModule)} }`)
    return file
  })

  const code = generateI18n({ srcDir, pluginExtensions } as unknown as BuiltMercurConfig)
  const out = path.join(root, "virtual-i18n.ts")
  fs.writeFileSync(out, code)

  return (await import(out)).default
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe("generateI18n", () => {
  test("no app file and no plugins yields empty resources", async () => {
    expect(await setup({})).toEqual({})
  })

  test("app file only is returned verbatim", async () => {
    const app = { en: { translation: { a: "1" } } }
    expect(await setup({ app })).toEqual(app)
  })

  test("plugin resources are included", async () => {
    const plugin = { en: { translation: { a: 1 } } }
    expect(await setup({ plugins: [plugin] })).toEqual(plugin)
  })

  test("plugin and app deep-merge, app wins on conflicts", async () => {
    const result = await setup({
      plugins: [{ en: { translation: { x: { a: 1, c: "plugin" } } } }],
      app: { en: { translation: { x: { b: 2, c: "app" } } } },
    })
    expect(result).toEqual({ en: { translation: { x: { a: 1, b: 2, c: "app" } } } })
  })

  test("languages from plugin and app are both kept", async () => {
    const result = await setup({
      plugins: [{ pl: { translation: { a: "pl" } } }],
      app: { en: { translation: { a: "en" } } },
    })
    expect(result).toEqual({
      pl: { translation: { a: "pl" } },
      en: { translation: { a: "en" } },
    })
  })

  test("later plugins win over earlier ones", async () => {
    const result = await setup({
      plugins: [{ en: { translation: { a: 1 } } }, { en: { translation: { a: 2 } } }],
    })
    expect(result).toEqual({ en: { translation: { a: 2 } } })
  })
})
