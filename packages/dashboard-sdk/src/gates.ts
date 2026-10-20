import fs from "fs"
import path from "path"
import { normalizePath, getParserOptions, hasDefaultExport, crawlModuleFiles } from "./utils"
import {
    parse,
    traverse,
    isCallExpression,
    isIdentifier,
    isNumericLiteral,
    isObjectExpression,
    isObjectProperty,
    isStringLiteral,
    isUnaryExpression,
    isVariableDeclaration,
    isVariableDeclarator,
} from "./babel"

type GateInfo = { id?: string; order?: number }

function readNumber(node: any): number | undefined {
    if (isNumericLiteral(node)) return node.value
    if (isUnaryExpression(node) && node.operator === "-" && isNumericLiteral(node.argument)) {
        return -node.argument.value
    }
    return undefined
}

function readGateConfig(properties: any[]): GateInfo {
    const info: GateInfo = {}
    for (const prop of properties) {
        if (!isObjectProperty(prop)) continue
        if (isIdentifier(prop.key, { name: "id" }) && isStringLiteral(prop.value)) {
            info.id = prop.value.value
        }
        if (isIdentifier(prop.key, { name: "order" })) {
            info.order = readNumber(prop.value)
        }
    }
    return info
}

function getGateConfig(file: string): GateInfo | null {
    try {
        const ast = parse(fs.readFileSync(file, "utf-8"), getParserOptions(file))
        if (!hasDefaultExport(ast)) return null

        let info: GateInfo = {}
        const visit = (declaration: any) => {
            if (!isVariableDeclaration(declaration)) return
            for (const decl of declaration.declarations) {
                if (!isVariableDeclarator(decl) || !isIdentifier(decl.id, { name: "config" })) continue
                const node = decl.init
                if (isCallExpression(node) && isObjectExpression(node.arguments[0])) {
                    info = readGateConfig(node.arguments[0].properties)
                } else if (isObjectExpression(node)) {
                    info = readGateConfig(node.properties)
                }
            }
        }
        traverse(ast, {
            ExportNamedDeclaration(p: any) {
                visit(p.node.declaration)
            },
        })
        return info
    } catch {
        return null
    }
}

/**
 * Crawl a `src/gates` directory. A gate wraps the whole panel (terms
 * acceptance, licence checks); its `config` carries an id and an `order`,
 * lower rendering outermost. Files without a default export are skipped.
 */
export function collectGates(srcDir: string, startIndex = 0): { imports: string[]; entries: string[] } {
    const gatesDir = path.join(srcDir, "gates")
    const imports: string[] = []
    const entries: string[] = []
    let index = startIndex

    for (const file of crawlModuleFiles(gatesDir)) {
        const info = getGateConfig(file)
        if (!info) continue
        const name = `Gate${index++}`
        const id = info.id ?? normalizePath(path.relative(gatesDir, file)).replace(/\.[^.]+$/, "")
        imports.push(`import ${name} from "${normalizePath(file)}"`)
        entries.push(
            `        { Component: ${name}, id: ${JSON.stringify(id)}${
                info.order !== undefined ? `, order: ${info.order}` : ""
            } }`
        )
    }

    return { imports, entries }
}
