import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ServingMode } from "../../utils/dashboard/dashboard-base"

const MIME_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".map": "application/json",
    ".webp": "image/webp",
    ".txt": "text/plain",
}

function getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    return MIME_TYPES[ext] || "application/octet-stream"
}

function sanitizePath(relativePath: string): string | null {
    const normalized = path.normalize(relativePath)
    if (normalized.includes("..")) {
        return null
    }
    return normalized
}

export function proxyRequest(
    req: IncomingMessage,
    res: ServerResponse,
    viteUrl: string,
    targetPath: string
): void {
    const url = new URL(targetPath, viteUrl)

    const proxyReq = http.request(
        {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: req.method,
            headers: {
                ...req.headers,
                host: url.host,
            },
        },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
            proxyRes.pipe(res)
        }
    )

    proxyReq.on("error", () => {
        res.writeHead(502, { "Content-Type": "text/plain" })
        res.end("Vite dev server unavailable")
    })

    req.pipe(proxyReq)
}

export function serveStaticFile(
    appDir: string,
    relativePath: string,
    res: ServerResponse
): boolean {
    const safe = sanitizePath(relativePath)
    if (!safe) {
        res.writeHead(400, { "Content-Type": "text/plain" })
        res.end("Bad request")
        return true
    }

    const filePath = path.join(appDir, safe)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        return false
    }

    const mimeType = getMimeType(filePath)
    const isAsset = /\.(js|css|mjs|woff2?|ttf|eot|png|jpe?g|gif|svg|webp|ico)$/.test(filePath)

    res.writeHead(200, {
        "Content-Type": mimeType,
        ...(isAsset
            ? { "Cache-Control": "public, max-age=31536000, immutable" }
            : { "Cache-Control": "no-cache" }),
    })

    fs.createReadStream(filePath).pipe(res)
    return true
}

export function serveSpaFallback(appDir: string, res: ServerResponse): boolean {
    const indexPath = path.join(appDir, "index.html")
    if (!fs.existsSync(indexPath)) {
        return false
    }

    res.writeHead(200, {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
    })
    fs.createReadStream(indexPath).pipe(res)
    return true
}

export function serveDefaultPage(res: ServerResponse): void {
    res.writeHead(200, {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
    })
    res.end('Dashboard not built')
}


export function serveDashboardMiddleware({ path, mode, appDir, viteUrl }: { path: string, mode: ServingMode, appDir: string, viteUrl: string }) {
    return async (req: MedusaRequest, res: MedusaResponse) => {
        const url = req.url || "/"
        const relativePath = url.replace(new RegExp(`^${path}`), "") || "/"

        switch (mode) {
            case "vite-proxy": {
                proxyRequest(req, res, viteUrl, relativePath)
                return
            }

            case "static": {
                // Try serving the exact file first
                if (relativePath !== "/" && serveStaticFile(appDir, relativePath, res)) {
                    return
                }
                // SPA fallback for non-asset routes
                if (serveSpaFallback(appDir, res)) {
                    return
                }
                // Fall through to default page if index.html disappeared
                serveDefaultPage(res)
                return
            }

            case "default-page":
            default: {
                serveDefaultPage(res)
                return
            }
        }
    }
}
