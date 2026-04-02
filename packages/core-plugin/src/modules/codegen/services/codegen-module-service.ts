import { exec } from "child_process"
import { existsSync } from "fs"
import { join } from "path"
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

    private detectPackageRunner_(): string {
        const cwd = process.cwd()
        const lockfiles: [string, string][] = [
            ["bun.lockb", "bunx"],
            ["bun.lock", "bunx"],
            ["pnpm-lock.yaml", "pnpm exec"],
            ["yarn.lock", "yarn"],
        ]

        const runner = lockfiles.find(([file]) => existsSync(join(cwd, file)))
        return `${runner ? runner[1] : "npx"} mercurjs codegen`
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
