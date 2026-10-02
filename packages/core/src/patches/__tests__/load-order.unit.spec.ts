import { execFileSync } from "child_process"
import { join } from "path"

// Jest resolves modules through its own registry and never reaches Node's
// loader, which is where the patches live, so each case runs in a real process.
const CORE_ROOT = join(__dirname, "..", "..", "..")

function execute(fixture: string, env: NodeJS.ProcessEnv = {}): string {
  return execFileSync(
    process.execPath,
    [require.resolve("tsx/cli"), join(__dirname, "fixtures", fixture)],
    {
      cwd: CORE_ROOT,
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "test", ...env },
    }
  )
}

function run(fixture: string): unknown {
  // With LOG_LEVEL=debug each applied patch is logged to stdout ahead of the result.
  return JSON.parse(execute(fixture).trim().split("\n").pop()!)
}

describe("patch load order", () => {
  it("patches core-flows as a side effect of importing @mercurjs/core", () => {
    expect(run("core-imported-first.ts")).toEqual(["function", "function"])
  })

  it("reaches the package index when core-flows was loaded before patching", () => {
    expect(run("core-flows-first.ts")).toEqual({
      before: ["undefined", "undefined"],
      after: ["function", "function"],
    })
  })

  it("logs applied patches at debug, out of the default console output", () => {
    expect(execute("core-imported-first.ts", { LOG_LEVEL: "http" })).not.toContain(
      "Applied patch"
    )
    expect(execute("core-imported-first.ts", { LOG_LEVEL: "debug" })).toContain(
      "Applied patch"
    )
  })

  it("exposes fulfillmentDelivered on the workflow exported from @mercurjs/core/workflows", () => {
    expect(run("workflows-entry.ts")).toEqual("function")
  })
})
