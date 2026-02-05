export function resolveExports(moduleExports: any) {
    if (
        "default" in moduleExports &&
        moduleExports.default &&
        "default" in moduleExports.default
    ) {
        return resolveExports(moduleExports.default)
    }
    return moduleExports
}

export async function getFileExports(path: string): Promise<any> {
    const { unregister } = await safeRegister()
    const module = require(path)
    unregister()

    return resolveExports(module)
}

export const safeRegister = async () => {
    const { register } = await import("esbuild-register/dist/node")
    let res: { unregister: () => void }
    try {
        res = register({
            format: "cjs",
            loader: "ts",
        })
    } catch {
        res = {
            unregister: () => {},
        }
    }

    return res
}

export function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, "/")
}
