import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { DashboardModuleOptions } from "@mercurjs/types"
import { Logger } from "@medusajs/medusa"

export type ServingMode = "vite-proxy" | "static" | "default-page"

export abstract class DashboardBase {
    protected readonly options_: DashboardModuleOptions
    protected readonly logger: Logger
    protected servingMode_: ServingMode = "default-page"
    protected lastDetectionTime_: number = 0

    protected abstract readonly appName: string
    private static readonly REDETECT_THROTTLE_MS = 5000

    constructor({ logger }: { logger: Logger }, options: DashboardModuleOptions) {
        this.options_ = options
        this.logger = logger
    }

    __hooks = {
        onApplicationStart: async () => {
            await this.onApplicationStart()
        },
        onApplicationShutdown: async () => {
            this.onApplicationShutdown()
        },
    }

    async onApplicationStart(): Promise<void> {
        await this.detectServingMode()
        this.logger.info(`${this.appName} URL → http://localhost:${this.options_.viteDevServerPort}${this.options_.path}`)
    }

    onApplicationShutdown(): void {
        this.servingMode_ = "default-page"
    }

    async detectServingMode(): Promise<void> {
        this.lastDetectionTime_ = Date.now()

        if (await this.checkViteDevServer()) {
            this.servingMode_ = "vite-proxy"
            return
        }

        if (this.checkBuiltFiles()) {
            this.servingMode_ = "static"
            return
        }

        this.servingMode_ = "default-page"
    }

    async maybeRedetect(): Promise<void> {
        if (this.servingMode_ !== "default-page") {
            return
        }

        const now = Date.now()
        if (now - this.lastDetectionTime_ < DashboardBase.REDETECT_THROTTLE_MS) {
            return
        }

        await this.detectServingMode()
    }

    getServingMode(): ServingMode {
        return this.servingMode_
    }

    getOptions(): DashboardModuleOptions {
        return this.options_
    }

    getViteDevServerUrl(): string {
        const host = this.options_.viteDevServerHost ?? "localhost"
        const port = this.options_.viteDevServerPort ?? 5174
        return `http://${host}:${port}`
    }

    private checkViteDevServer(): Promise<boolean> {
        const host = this.options_.viteDevServerHost ?? "localhost"
        const port = this.options_.viteDevServerPort ?? 5174

        return new Promise((resolve) => {
            const req = http.request(
                { host, port, method: "HEAD", path: "/", timeout: 1000 },
                (res) => {
                    res.resume()
                    resolve(res.statusCode !== undefined)
                }
            )
            req.on("error", () => resolve(false))
            req.on("timeout", () => {
                req.destroy()
                resolve(false)
            })
            req.end()
        })
    }

    private checkBuiltFiles(): boolean {
        return fs.existsSync(path.join(this.options_.appDir, "index.html"))
    }
}
