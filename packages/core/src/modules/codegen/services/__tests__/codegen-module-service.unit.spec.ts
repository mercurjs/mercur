import fs from "fs"
import os from "os"
import path from "path"
import CodegenModuleService from "../codegen-module-service"

describe("CodegenModuleService", () => {
  const originalEnv = { ...process.env }
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mercur-codegen-test-"))
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
    process.env = originalEnv
  })

  const mockLogger = {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as any

  describe("detectPackageRunner_", () => {
    it("uses MERCUR_CODEGEN_COMMAND if specified", () => {
      process.env.MERCUR_CODEGEN_COMMAND = "custom-runner codegen"
      const service = new CodegenModuleService({ logger: mockLogger })

      expect((service as any).detectPackageRunner_()).toBe("custom-runner codegen")
    })

    it("prefers local CLI resolution with process.execPath when available", () => {
      delete process.env.MERCUR_CODEGEN_COMMAND
      const service = new CodegenModuleService({ logger: mockLogger })

      const command = (service as any).detectPackageRunner_()
      expect(command).toContain(process.execPath)
      expect(command).toContain("codegen")
    })

    it("walks parent directories to find bun.lock when local CLI is absent", () => {
      delete process.env.MERCUR_CODEGEN_COMMAND
      const service = new CodegenModuleService({ logger: mockLogger })

      // Create a nested workspace: root has bun.lock, child has apps/api
      const rootDir = path.join(tempDir, "workspace-root")
      const apiDir = path.join(rootDir, "apps", "api")
      fs.mkdirSync(apiDir, { recursive: true })
      fs.writeFileSync(path.join(rootDir, "bun.lock"), "")

      const runner = (service as any).findNearestLockfileRunner_(apiDir)
      expect(runner).toBe("bunx")
    })

    it("walks parent directories to find pnpm-lock.yaml when local CLI is absent", () => {
      const service = new CodegenModuleService({ logger: mockLogger })

      const rootDir = path.join(tempDir, "workspace-root")
      const apiDir = path.join(rootDir, "packages", "api")
      fs.mkdirSync(apiDir, { recursive: true })
      fs.writeFileSync(path.join(rootDir, "pnpm-lock.yaml"), "")

      const runner = (service as any).findNearestLockfileRunner_(apiDir)
      expect(runner).toBe("pnpm exec")
    })

    it("falls back to npx if no ancestor lockfile is found", () => {
      const service = new CodegenModuleService({ logger: mockLogger })

      const emptyDir = path.join(tempDir, "isolated")
      fs.mkdirSync(emptyDir, { recursive: true })

      const runner = (service as any).findNearestLockfileRunner_(emptyDir)
      expect(runner).toBe("npx")
    })
  })

  describe("onApplicationStart", () => {
    it("skips codegen when NODE_ENV is production", async () => {
      process.env.NODE_ENV = "production"
      const service = new CodegenModuleService({ logger: mockLogger })
      const runSpy = jest.spyOn(service as any, "runCodegen_").mockResolvedValue(undefined)

      await service.onApplicationStart()
      expect(runSpy).not.toHaveBeenCalled()
    })

    it("skips codegen when MERCUR_DEV_CODEGEN is false", async () => {
      process.env.NODE_ENV = "development"
      process.env.MERCUR_DEV_CODEGEN = "false"
      const service = new CodegenModuleService({ logger: mockLogger })
      const runSpy = jest.spyOn(service as any, "runCodegen_").mockResolvedValue(undefined)

      await service.onApplicationStart()
      expect(runSpy).not.toHaveBeenCalled()
    })

    it("runs codegen in development and logs warnings on failure without throwing", async () => {
      process.env.NODE_ENV = "development"
      delete process.env.MERCUR_DEV_CODEGEN
      const service = new CodegenModuleService({ logger: mockLogger })
      jest.spyOn(service as any, "runCodegen_").mockRejectedValue(new Error("Command failed"))

      await expect(service.onApplicationStart()).resolves.toBeUndefined()
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("Codegen failed"))
    })
  })
})
