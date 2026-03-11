export type ServingMode = "vite-proxy" | "static" | "default-page"

export interface DashboardModuleOptions {
  disable?: boolean
  name: string
  path: string
  appDir: string
  viteDevServerPort?: number
  viteDevServerHost?: string
}
