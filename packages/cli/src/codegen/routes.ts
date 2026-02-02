import path from "path";
import ts, { type CompilerOptions } from "typescript";
import { ROUTE_FILE_PATTERN } from "./constants";
import { pathExists, recursiveReadDir } from "./fs";
import { normalizeApiPath, normalizePathSep } from "./path";
import type { HttpMethod, RouteHandler, RouteInfo } from "@mercurjs/types";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "DELETE"];

/**
 * Extract the first generic type argument from a TypeScript type
 */
function extractGenericArg(
    type: ts.Type,
    checker: ts.TypeChecker
): string | null {
    const typeArgs = (type as ts.TypeReference).typeArguments;
    if (typeArgs && typeArgs.length > 0) {
        return checker.typeToString(typeArgs[0]);
    }
    return null;
}

/**
 * Extract route handlers with input/output types from a route file
 * using TypeScript compiler API for proper type inference
 */
function extractRouteHandlers(filePath: string, tsConfig: CompilerOptions): RouteHandler[] {
    const handlers: RouteHandler[] = [];

    const program = ts.createProgram([filePath], tsConfig);

    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);

    if (!sourceFile) {
        return handlers;
    }

    const visitNode = (node: ts.Node) => {
        // Handle: export const GET = async (req, res) => ...
        if (ts.isVariableStatement(node)) {
            const isExported = node.modifiers?.some(
                (m) => m.kind === ts.SyntaxKind.ExportKeyword
            );
            if (!isExported) return;

            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;

                const name = decl.name.getText() as HttpMethod;
                if (!HTTP_METHODS.includes(name)) continue;

                if (decl.initializer) {
                    const handler = extractHandlerFromExpression(
                        decl.initializer,
                        name,
                        checker,
                        node
                    );
                    if (handler) handlers.push(handler);
                }
            }
        }

        // Handle: export async function GET(req, res) { ... }
        if (ts.isFunctionDeclaration(node) && node.name) {
            const isExported = node.modifiers?.some(
                (m) => m.kind === ts.SyntaxKind.ExportKeyword
            );
            if (!isExported) return;

            const name = node.name.getText() as HttpMethod;
            if (!HTTP_METHODS.includes(name)) return;

            const handler = extractHandlerFromFunction(node, name, checker);
            if (handler) handlers.push(handler);
        }

        ts.forEachChild(node, visitNode);
    };

    visitNode(sourceFile);

    return handlers;
}

/**
 * Extract handler info from an arrow function or function expression
 */
function extractHandlerFromExpression(
    expr: ts.Expression,
    method: HttpMethod,
    checker: ts.TypeChecker,
    contextNode: ts.Node
): RouteHandler | null {
    const type = checker.getTypeAtLocation(expr);
    const signatures = type.getCallSignatures();

    if (signatures.length === 0) return null;

    const signature = signatures[0];
    const params = signature.getParameters();

    if (params.length < 2) return null;

    const reqType = checker.getTypeOfSymbolAtLocation(params[0], contextNode);
    const resType = checker.getTypeOfSymbolAtLocation(params[1], contextNode);

    return {
        method,
        input: extractGenericArg(reqType, checker),
        output: extractGenericArg(resType, checker),
    };
}

/**
 * Extract handler info from a function declaration
 */
function extractHandlerFromFunction(
    node: ts.FunctionDeclaration,
    method: HttpMethod,
    checker: ts.TypeChecker
): RouteHandler | null {
    const params = node.parameters;

    if (params.length < 2) return null;

    const reqParam = params[0];
    const resParam = params[1];

    if (!reqParam.type || !resParam.type) {
        return { method, input: null, output: null };
    }

    const reqType = checker.getTypeFromTypeNode(reqParam.type);
    const resType = checker.getTypeFromTypeNode(resParam.type);

    return {
        method,
        input: extractGenericArg(reqType, checker),
        output: extractGenericArg(resType, checker),
    };
}

/**
 * Get all API routes from src/api directory
 */
export async function getRoutes(apiDir: string, tsConfig: CompilerOptions): Promise<RouteInfo[]> {
    const exists = await pathExists(apiDir);
    if (!exists) {
        return [];
    }

    const files = await recursiveReadDir(apiDir, {
        pathnameFilter: (pathname) => ROUTE_FILE_PATTERN.test(pathname),
        ignorePartFilter: (part) => part.startsWith("_") || part === "node_modules",
    });

    const routes: RouteInfo[] = files.map((filePath) => {
        const relativePath = path.relative(apiDir, filePath);
        const route = normalizeApiPath(normalizePathSep(relativePath));

        const handlers = extractRouteHandlers(filePath, tsConfig);

        return {
            filePath: normalizePathSep(path.relative(apiDir, filePath)),
            route,
            handlers,
        };
    });

    return routes;
}
