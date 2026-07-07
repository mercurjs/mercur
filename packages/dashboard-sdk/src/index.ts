// Browser-safe entry: config helpers + types only. The Vite plugin (node-only,
// pulls in fs/path) lives at "@mercurjs/dashboard-sdk/vite" so panel code that
// imports a config helper never drags node globals into the browser bundle.
export * from "./types"
export * from "./config"
