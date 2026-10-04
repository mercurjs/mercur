import { exec } from "child_process"
import { existsSync } from "fs"
import { createRequire } from "module"
import { dirname, join } from "path"
import { Logger } from "@medusajs/medusa"

export default class CodegenModuleService {
    private readonly logger: Logger

    constructor({ logger }: { logger: Logger }) {
        this.logger = logger
    }

    __hooks = {
        onApplicationStart: async () => {
            await this.onApplicationStart()
        },
    }

    async onApplicationStart(): Promise<void> {
        if (process.env.NODE_ENV !== "development") {
            return
        }

        if (process.env.MERCUR_DEV_CODEGEN === "false") {
            return
        }

        try {
            await this.runCodegen_()
        } catch (error) {
            this.logger.warn(`Codegen failed: ${error}`)
        }
    }

    private resolveLocalCli_(cwd: string): string | null {
        try {
            const req = createRequire(join(cwd, "noop.js"))
            const binPath = req.resolve("@mercurjs/cli")
            if (existsSync(binPath)) {
                return binPath
            }
        } catch {
            // @mercurjs/cli not resolvable as a module from cwd
        }

        let currentDir = cwd
        while (true) {
            const workspaceCli = join(currentDir, "packages", "cli", "dist", "index.js")
            if (existsSync(workspaceCli)) {
                return workspaceCli
            }
            const parentDir = dirname(currentDir)
            if (parentDir === currentDir) {
                break
            }
            currentDir = parentDir
        }

        return null
    }

    private findNearestLockfileRunner_(cwd: string): string {
        let currentDir = cwd
        const lockfiles: [string, string][] = [
            ["bun.lockb", "bunx"],
            ["bun.lock", "bunx"],
            ["pnpm-lock.yaml", "pnpm exec"],
            ["yarn.lock", "yarn"],
            ["package-lock.json", "npx"],
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

    private detectPackageRunner_(): string {
        if (process.env.MERCUR_CODEGEN_COMMAND) {
            return process.env.MERCUR_CODEGEN_COMMAND
        }

        const cwd = process.cwd()
        const localCli = this.resolveLocalCli_(cwd)
        if (localCli) {
            return `"${process.execPath}" "${localCli}" codegen`
        }

        const runner = this.findNearestLockfileRunner_(cwd)
        return `${runner} @mercurjs/cli codegen`
    }

    private runCodegen_(): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = this.detectPackageRunner_()
            exec(
                command,
                { cwd: process.cwd(), timeout: 15000 },
                (error, _stdout, stderr) => {
                    if (error) {
                        reject(stderr || error.message)
                        return
                    }
                    resolve()
                }
            )
        })
    }
}

