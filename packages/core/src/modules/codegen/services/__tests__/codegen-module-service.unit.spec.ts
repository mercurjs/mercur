import fs from "fs"
import os from "os"
import path from "path"
import * as childProcess from "child_process"
import { Logger } from "@medusajs/medusa"
import CodegenModuleService from "../codegen-module-service"
import * as utils from "../../utils"
import {
  resolveLocalCli,
  detectPackageRunner,
  runCodegen,
} from "../../utils"

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
  } as unknown as Logger

  describe("resolveLocalCli", () => {
    it("resolves installed @mercurjs/cli entry point from cwd", () => {
      const cliDir = path.join(tempDir, "node_modules", "@mercurjs", "cli")
      fs.mkdirSync(cliDir, { recursive: true })
      const entryFile = path.join(cliDir, "index.js")
      fs.writeFileSync(entryFile, "// entry")
      fs.writeFileSync(
        path.join(cliDir, "package.json"),
        JSON.stringify({ name: "@mercurjs/cli", main: "index.js" })
      )

      const resolved = resolveLocalCli(tempDir)
      expect(resolved).toBe(entryFile)
    })

    it("returns null when @mercurjs/cli is not resolvable", () => {
      const emptyDir = path.join(tempDir, "isolated")
      fs.mkdirSync(emptyDir, { recursive: true })

      expect(resolveLocalCli(emptyDir)).toBeNull()
    })
  })

  describe("detectPackageRunner", () => {
    it("detects bunx from npm_config_user_agent", () => {
      process.env.npm_config_user_agent = "bun/1.1.20 npm/? node/v22.0.0 linux x64"
      expect(detectPackageRunner(tempDir)).toBe("bunx")
    })

    it("detects pnpm dlx from npm_config_user_agent", () => {
      process.env.npm_config_user_agent = "pnpm/9.0.0 npm/? node/v22.0.0 linux x64"
      expect(detectPackageRunner(tempDir)).toBe("pnpm dlx")
    })

    it("detects npx from npm_config_user_agent for other managers", () => {
      process.env.npm_config_user_agent = "npm/10.5.0 node/v22.0.0 linux x64"
      expect(detectPackageRunner(tempDir)).toBe("npx")
    })

    it("walks parent directories to find bun.lock when user agent is unset", () => {
      delete process.env.npm_config_user_agent
      const rootDir = path.join(tempDir, "workspace-root")
      const apiDir = path.join(rootDir, "apps", "api")
      fs.mkdirSync(apiDir, { recursive: true })
      fs.writeFileSync(path.join(rootDir, "bun.lock"), "")

      expect(detectPackageRunner(apiDir)).toBe("bunx")
    })

    it("walks parent directories to find bun.lockb when user agent is unset", () => {
      delete process.env.npm_config_user_agent
      const rootDir = path.join(tempDir, "workspace-root")
      const apiDir = path.join(rootDir, "apps", "api")
      fs.mkdirSync(apiDir, { recursive: true })
      fs.writeFileSync(path.join(rootDir, "bun.lockb"), "")

      expect(detectPackageRunner(apiDir)).toBe("bunx")
    })

    it("walks parent directories to find pnpm-lock.yaml when user agent is unset", () => {
      delete process.env.npm_config_user_agent
      const rootDir = path.join(tempDir, "workspace-root")
      const apiDir = path.join(rootDir, "packages", "api")
      fs.mkdirSync(apiDir, { recursive: true })
      fs.writeFileSync(path.join(rootDir, "pnpm-lock.yaml"), "")

      expect(detectPackageRunner(apiDir)).toBe("pnpm dlx")
    })

    it("falls back to npx when no ancestor lockfile is found", () => {
      delete process.env.npm_config_user_agent
      const emptyDir = path.join(tempDir, "isolated")
      fs.mkdirSync(emptyDir, { recursive: true })

      expect(detectPackageRunner(emptyDir)).toBe("npx")
    })
  })

  describe("runCodegen", () => {
    it("executes local CLI with execFile when resolved", async () => {
      const cliDir = path.join(tempDir, "node_modules", "@mercurjs", "cli")
      fs.mkdirSync(cliDir, { recursive: true })
      const entryFile = path.join(cliDir, "index.js")
      fs.writeFileSync(entryFile, "// entry")
      fs.writeFileSync(
        path.join(cliDir, "package.json"),
        JSON.stringify({ name: "@mercurjs/cli", main: "index.js" })
      )

      const execFileSpy = jest
        .spyOn(childProcess, "execFile")
        .mockImplementation((_file, _args, _options, callback) => {
          if (typeof callback === "function") {
            callback(null, "", "")
          }
          return {} as childProcess.ChildProcess
        })

      await runCodegen(tempDir)

      expect(execFileSpy).toHaveBeenCalledTimes(1)
      expect(execFileSpy.mock.calls[0][0]).toBe(process.execPath)
      expect(execFileSpy.mock.calls[0][1]).toEqual([entryFile, "codegen"])
      expect(execFileSpy.mock.calls[0][2]).toEqual({ cwd: tempDir, timeout: 15000 })
      execFileSpy.mockRestore()
    })

    it("rejects with explicit timeout message when execution times out", async () => {
      const cliDir = path.join(tempDir, "node_modules", "@mercurjs", "cli")
      fs.mkdirSync(cliDir, { recursive: true })
      const entryFile = path.join(cliDir, "index.js")
      fs.writeFileSync(entryFile, "// entry")
      fs.writeFileSync(
        path.join(cliDir, "package.json"),
        JSON.stringify({ name: "@mercurjs/cli", main: "index.js" })
      )

      const timeoutError = Object.assign(new Error("Command failed"), {
        killed: true,
      })
      const execFileSpy = jest
        .spyOn(childProcess, "execFile")
        .mockImplementation((_file, _args, _options, callback) => {
          if (typeof callback === "function") {
            callback(
              timeoutError as unknown as childProcess.ExecException,
              "",
              ""
            )
          }
          return {} as childProcess.ChildProcess
        })

      await expect(runCodegen(tempDir)).rejects.toThrow(
        "Codegen timed out after 15s"
      )
      execFileSpy.mockRestore()
    })

    it("rejects with error message on execution failure", async () => {
      const cliDir = path.join(tempDir, "node_modules", "@mercurjs", "cli")
      fs.mkdirSync(cliDir, { recursive: true })
      const entryFile = path.join(cliDir, "index.js")
      fs.writeFileSync(entryFile, "// entry")
      fs.writeFileSync(
        path.join(cliDir, "package.json"),
        JSON.stringify({ name: "@mercurjs/cli", main: "index.js" })
      )

      const executionError = new Error("Compilation error")
      const execFileSpy = jest
        .spyOn(childProcess, "execFile")
        .mockImplementation((_file, _args, _options, callback) => {
          if (typeof callback === "function") {
            callback(
              executionError as unknown as childProcess.ExecException,
              "",
              "Compilation error"
            )
          }
          return {} as childProcess.ChildProcess
        })

      await expect(runCodegen(tempDir)).rejects.toThrow("Compilation error")
      execFileSpy.mockRestore()
    })

    it("falls back to package runner via exec when local CLI is not found", async () => {
      const emptyDir = path.join(tempDir, "isolated")
      fs.mkdirSync(emptyDir, { recursive: true })
      process.env.npm_config_user_agent = "bun/1.1.20"

      const execSpy = jest
        .spyOn(childProcess, "exec")
        .mockImplementation((_cmd, _options, callback) => {
          if (typeof callback === "function") {
            callback(null, "", "")
          }
          return {} as childProcess.ChildProcess
        })

      await runCodegen(emptyDir)

      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(execSpy.mock.calls[0][0]).toBe("bunx @mercurjs/cli codegen")
      expect(execSpy.mock.calls[0][1]).toEqual({ cwd: emptyDir })
      execSpy.mockRestore()
    })
  })

  describe("onApplicationStart", () => {
    it("skips codegen when NODE_ENV is production", async () => {
      process.env.NODE_ENV = "production"
      const runSpy = jest.spyOn(utils, "runCodegen").mockResolvedValue(undefined)
      const service = new CodegenModuleService({ logger: mockLogger })

      await service.onApplicationStart()
      expect(runSpy).not.toHaveBeenCalled()
      runSpy.mockRestore()
    })

    it("skips codegen when MERCUR_DEV_CODEGEN is false", async () => {
      process.env.NODE_ENV = "development"
      process.env.MERCUR_DEV_CODEGEN = "false"
      const runSpy = jest.spyOn(utils, "runCodegen").mockResolvedValue(undefined)
      const service = new CodegenModuleService({ logger: mockLogger })

      await service.onApplicationStart()
      expect(runSpy).not.toHaveBeenCalled()
      runSpy.mockRestore()
    })

    it("runs codegen in development and logs warnings on failure without throwing", async () => {
      process.env.NODE_ENV = "development"
      delete process.env.MERCUR_DEV_CODEGEN
      const runSpy = jest
        .spyOn(utils, "runCodegen")
        .mockRejectedValue(new Error("Command failed"))
      const service = new CodegenModuleService({ logger: mockLogger })

      await expect(service.onApplicationStart()).resolves.toBeUndefined()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Codegen failed: Command failed")
      )
      runSpy.mockRestore()
    })

    it("logs timeout warning without throwing when codegen times out", async () => {
      process.env.NODE_ENV = "development"
      delete process.env.MERCUR_DEV_CODEGEN
      const runSpy = jest
        .spyOn(utils, "runCodegen")
        .mockRejectedValue(new Error("Codegen timed out after 15s"))
      const service = new CodegenModuleService({ logger: mockLogger })

      await expect(service.onApplicationStart()).resolves.toBeUndefined()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Codegen failed: Codegen timed out after 15s"
      )
      runSpy.mockRestore()
    })
  })
})
