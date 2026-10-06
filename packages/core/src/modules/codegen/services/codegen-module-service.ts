import { Logger } from "@medusajs/medusa"
import { runCodegen } from "../utils"

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
            await runCodegen(process.cwd())
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.warn(`Codegen failed: ${message}`)
        }
    }
}
