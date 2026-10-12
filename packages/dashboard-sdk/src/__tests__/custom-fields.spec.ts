import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, test } from "vitest"
import { generateCustomFields } from "../custom-fields"
import type { BuiltMercurConfig } from "../types"

const tmpDirs: string[] = []

const setup = async ({
  app = [],
  plugins = [],
}: {
  app?: string[]
  plugins?: string[][]
}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mercur-custom-fields-"))
  tmpDirs.push(root)
  const srcDir = path.join(root, "src")
  fs.mkdirSync(path.join(srcDir, "custom-fields"), { recursive: true })

  for (const id of app) {
    fs.writeFileSync(
      path.join(srcDir, "custom-fields", `${id}.ts`),
      `export default { model: "product", id: "${id}" }`
    )
  }

  const pluginExtensions = plugins.map((ids, i) => {
    const file = path.join(root, `plugin-${i}.ts`)
    const configs = ids.map((id) => ({ model: "product", id }))
    fs.writeFileSync(
      file,
      `export default { customFieldsModule: { configs: ${JSON.stringify(configs)} } }`
    )
    return file
  })

  const code = generateCustomFields({
    srcDir,
    pluginExtensions,
  } as unknown as BuiltMercurConfig)
  const out = path.join(root, "virtual-custom-fields.ts")
  fs.writeFileSync(out, code)

  const { configs } = (await import(out)).default as {
    configs: { id: string }[]
  }
  return configs.map((c) => c.id)
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe("generateCustomFields", () => {
  test("no configs yields an empty module", async () => {
    expect(await setup({})).toEqual([])
  })

  test("orders plugin configs before the host app's so the host applies last", async () => {
    expect(
      await setup({ app: ["host"], plugins: [["plugin-a"], ["plugin-b"]] })
    ).toEqual(["plugin-a", "plugin-b", "host"])
  })
})
