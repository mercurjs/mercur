import fs from "fs"
import os from "os"
import path from "path"
import { MedusaRequest } from "@medusajs/framework"

const getResolvedPlugins = jest.fn()

jest.mock("@medusajs/framework/utils", () => ({
  ...jest.requireActual("@medusajs/framework/utils"),
  getResolvedPlugins: (...args: unknown[]) => getResolvedPlugins(...args),
}))

import { resolvePluginUnauthenticatedRoutes } from "../scan-unauthenticated-routes"
import { unlessBaseUrl } from "../unless-base-url"

const writeRoute = (srcDir: string, route: string, content: string) => {
  const dir = path.join(srcDir, "api", "vendor", route)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "route.js"), content)
}

const makeReq = (baseUrl: string) =>
  ({
    baseUrl,
    method: "GET",
    scope: { resolve: () => ({}) },
  }) as unknown as MedusaRequest

describe("resolvePluginUnauthenticatedRoutes", () => {
  let pluginSrc: string

  beforeAll(() => {
    pluginSrc = fs.mkdtempSync(path.join(os.tmpdir(), "mercur-plugin-"))
    writeRoute(
      pluginSrc,
      "legal/terms",
      "exports.AUTHENTICATE = false\nexports.GET = () => {}\n"
    )
    writeRoute(pluginSrc, "legal/acceptances", "exports.GET = () => {}\n")
    getResolvedPlugins.mockResolvedValue([{ resolve: pluginSrc }])
  })

  afterAll(() => {
    fs.rmSync(pluginSrc, { recursive: true, force: true })
  })

  it("skips the middleware only for plugin routes exporting AUTHENTICATE = false", async () => {
    const middleware = jest.fn()
    const next = jest.fn()
    const guarded = unlessBaseUrl(resolvePluginUnauthenticatedRoutes, middleware)

    await guarded(makeReq("/vendor/legal/terms"), {} as never, next)
    expect(next).toHaveBeenCalledWith()
    expect(middleware).not.toHaveBeenCalled()

    await guarded(makeReq("/vendor/legal/acceptances"), {} as never, next)
    expect(middleware).toHaveBeenCalledTimes(1)
  })

  it("resolves the plugin list once", async () => {
    await resolvePluginUnauthenticatedRoutes(makeReq("/vendor/x"))
    expect(getResolvedPlugins).toHaveBeenCalledTimes(1)
  })
})
