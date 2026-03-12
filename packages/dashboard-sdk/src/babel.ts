import { parse } from "@babel/parser"
import _traverse from "@babel/traverse"
import {
    isBooleanLiteral,
    isCallExpression,
    isFunctionDeclaration,
    isIdentifier,
    isMemberExpression,
    isNumericLiteral,
    isObjectExpression,
    isObjectProperty,
    isStringLiteral,
    isVariableDeclaration,
    isVariableDeclarator,
    isArrayExpression,
} from "@babel/types"

let traverse: typeof _traverse
if (typeof _traverse === "function") {
    traverse = _traverse
} else {
    traverse = (_traverse as any).default
}

export {
    parse,
    traverse,
    isBooleanLiteral,
    isCallExpression,
    isFunctionDeclaration,
    isIdentifier,
    isMemberExpression,
    isNumericLiteral,
    isObjectExpression,
    isObjectProperty,
    isStringLiteral,
    isVariableDeclaration,
    isVariableDeclarator,
    isArrayExpression,
}
