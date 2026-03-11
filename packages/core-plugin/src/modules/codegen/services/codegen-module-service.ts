import { exec } from "child_process"
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
        try {
            await this.runCodegen_()
        } catch (error) {
            this.logger.warn(`Codegen failed: ${error}`)
        }
    }

    private runCodegen_(): Promise<void> {
        return new Promise((resolve, reject) => {
            exec("npx mercurjs codegen", { cwd: process.cwd() }, (error, _stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message)
                    return
                }
                resolve()
            })
        })
    }
}
