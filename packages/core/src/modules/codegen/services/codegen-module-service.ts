import { exec } from "child_process"
import { existsSync } from "fs"
import { dirname, join, parse } from "path"
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

        try {
            await this.runCodegen_()
        } catch (error) {
            this.logger.warn(`Codegen failed: ${error}`)
        }
    }

    private findNearestLockfileRunner_(): string | null {
        let current = process.cwd()
        const { root } = parse(current)
        const lockfiles: [string, string][] = [
            ["bun.lockb", "bunx"],
            ["bun.lock", "bunx"],
            ["pnpm-lock.yaml", "pnpm exec"],
            ["yarn.lock", "yarn"],
        ]

        while (true) {
            const runner = lockfiles.find(([file]) => existsSync(join(current, file)))
            if (runner) {
                return runner[1]
            }

            if (current === root) {
                return null
            }

            current = dirname(current)
        }
    }

    private detectPackageRunner_(): string {
        const runner = this.findNearestLockfileRunner_()
        return `${runner ?? "npx"} @mercurjs/cli codegen`
    }

    private runCodegen_(): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = this.detectPackageRunner_()
            exec(command, { cwd: process.cwd() }, (error, _stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message)
                    return
                }
                resolve()
            })
        })
    }
}
