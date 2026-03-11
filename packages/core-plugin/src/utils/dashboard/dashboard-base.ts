import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import { DashboardModuleOptions, ServingMode } from "@mercurjs/types"
import { Logger } from "@medusajs/medusa"

export abstract class DashboardBase {
    protected readonly options_: DashboardModuleOptions
    protected readonly logger: Logger
    protected servingMode_: ServingMode = "default-page"
    protected lastDetectionTime_: number = 0
    protected app_: express.Express

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
        if (!this.options_.disable) {
            this.app_ = this.createApp_()
            // todo: do not hardcode port
            this.logger.info(`${this.appName} URL → http://localhost:9000${this.options_.path}`)
        }
    }

    onApplicationShutdown(): void {
        this.servingMode_ = "default-page"
    }

    async detectServingMode(): Promise<void> {
        this.lastDetectionTime_ = Date.now()

        if (await this.checkViteDevServer_()) {
            this.servingMode_ = "vite-proxy"
            return
        }

        if (this.checkBuiltFiles_()) {
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
        const port = this.options_.viteDevServerPort
        return `http://${host}:${port}`
    }

    getApp(): express.Express {
        return this.app_
    }

    private createApp_(): express.Express {
        const app = express()
        const route = this.options_.path!

        const proxyMiddleware = createProxyMiddleware({
            target: this.getViteDevServerUrl(),
        })

        const staticServer = express.Router()
        staticServer.use(express.static(this.options_.appDir))
        staticServer.use((_req, res) => {
            const indexPath = path.join(this.options_.appDir, "index.html")
            if (fs.existsSync(indexPath)) {
                res.sendFile(path.resolve(indexPath))
            } else {
                this.sendDefaultPage_(res)
            }
        })

        app.use(route, async (req, res, next) => {
            await this.maybeRedetect()

            switch (this.servingMode_) {
                case "vite-proxy": {
                    proxyMiddleware(req, res, next)
                    return
                }

                case "static": {
                    staticServer(req, res, next)
                    return
                }

                case "default-page":
                default: {
                    this.sendDefaultPage_(res)
                    return
                }
            }
        })

        return app
    }

    private sendDefaultPage_(res: express.Response): void {
        res.status(200).type("html").send("Dashboard not built")
    }

    private checkViteDevServer_(): Promise<boolean> {
        const host = this.options_.viteDevServerHost ?? "localhost"
        const port = this.options_.viteDevServerPort

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

    private checkBuiltFiles_(): boolean {
        return fs.existsSync(path.join(this.options_.appDir, "index.html"))
    }
}
