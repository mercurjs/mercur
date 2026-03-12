import type { ParserOptions } from "@babel/parser"
import { traverse } from "./babel"

export function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, "/")
}

export function getParserOptions(file: string): ParserOptions {
    const options: ParserOptions = {
        sourceType: "module",
        plugins: ["jsx"],
    }

    if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        options.plugins!.push("typescript")
    }

    return options
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasDefaultExport(ast: any): boolean {
    let found = false

    traverse(ast, {
        ExportDefaultDeclaration() {
            found = true
        },
        AssignmentExpression(path: any) {
            if (
                path.node.left.type === "MemberExpression" &&
                path.node.left.object.type === "Identifier" &&
                path.node.left.object.name === "exports" &&
                path.node.left.property.type === "Identifier" &&
                path.node.left.property.name === "default"
            ) {
                found = true
            }
        },
        ExportNamedDeclaration(path: any) {
            const specifiers = path.node.specifiers
            if (
                specifiers?.some(
                    (s: any) =>
                        s.type === "ExportSpecifier" &&
                        s.exported.type === "Identifier" &&
                        s.exported.name === "default"
                )
            ) {
                found = true
            }
        },
    })

    return found
}
