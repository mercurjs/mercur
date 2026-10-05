import { exec, execFile } from "child_process"
import { existsSync } from "fs"
import { dirname, join } from "path"

export function resolveLocalCli(cwd: string): string | null {
    try {
        return require.resolve("@mercurjs/cli", { paths: [cwd] })
    } catch {
        return null
    }
}

export function findNearestLockfileRunner(cwd: string): string {
    let currentDir = cwd
    const lockfiles: [string, string][] = [
        ["bun.lockb", "bunx"],
        ["bun.lock", "bunx"],
        ["pnpm-lock.yaml", "pnpm dlx"],
    ]

    while (true) {
        for (const [file, runner] of lockfiles) {
            if (existsSync(join(currentDir, file))) {
                return runner
            }
        }
        const parentDir = dirname(currentDir)
        if (parentDir === currentDir) {
            break
        }
        currentDir = parentDir
    }

    return "npx"
}

export function detectPackageRunner(cwd: string): string {
    const userAgent = process.env.npm_config_user_agent
    if (userAgent) {
        if (userAgent.startsWith("bun")) {
            return "bunx"
        }
        if (userAgent.startsWith("pnpm")) {
            return "pnpm dlx"
        }
        return "npx"
    }

    return findNearestLockfileRunner(cwd)
}

export function runCodegen(cwd: string = process.cwd(), timeout: number = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
        const localCli = resolveLocalCli(cwd)
        if (localCli) {
            execFile(
                process.execPath,
                [localCli, "codegen"],
                { cwd, timeout },
                (error, _stdout, stderr) => {
                    if (error) {
                        if (error.killed) {
                            reject(new Error("Codegen timed out after 15s"))
                            return
                        }
                        reject(new Error(stderr || error.message))
                        return
                    }
                    resolve()
                }
            )
            return
        }

        const runner = detectPackageRunner(cwd)
        exec(
            `${runner} @mercurjs/cli codegen`,
            { cwd },
            (error, _stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message))
                    return
                }
                resolve()
            }
        )
    })
}
