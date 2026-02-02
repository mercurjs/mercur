# Type-Safe API Client with Auto-Generated Router Types

todo: research hydration things about nextjs

This document explains how to generate an `AppRouter` type by scanning the `/packages/core/src/api` directory structure, similar to how Next.js generates route types from the file system.

## API Structure Overview

The API follows a file-based routing pattern:

```
/packages/core/src/api/
├── admin/                    # Admin routes (/admin/*)
│   ├── sellers/
│   │   ├── route.ts          # GET (list), POST (create)
│   │   ├── validators.ts     # Zod schemas + inferred types
│   │   └── [id]/
│   │       └── route.ts      # GET (retrieve), POST (update), DELETE
│   └── ...
├── vendor/                   # Vendor routes (/vendor/*)
│   ├── products/
│   │   ├── route.ts
│   │   ├── validators.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── variants/
│   │           └── [variant_id]/
│   │               └── route.ts
│   └── ...
└── store/                    # Store routes (/store/*)
```

## Current Route File Patterns

### Route Handler Pattern (route.ts)

```typescript
// /api/vendor/products/route.ts
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductListResponse>  // <-- Response type
) => { ... }

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductType>,  // <-- Request body type
  res: MedusaResponse<HttpTypes.VendorProductResponse>       // <-- Response type
) => { ... }
```

### Validator Pattern (validators.ts)

```typescript
// /api/vendor/products/validators.ts
import { z } from "zod"

// Query params for list
export type VendorGetProductsParamsType = z.infer<typeof VendorGetProductsParams>
export const VendorGetProductsParams = createFindParams({ offset: 0, limit: 50 })
  .merge(z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    // ...
  }))

// Body for create
export type VendorCreateProductType = z.infer<typeof CreateProduct> & AdditionalData
export const CreateProduct = z.object({
  title: z.string(),
  // ...
}).strict()
```

## AppRouter Type Generation

### Step 1: Create Route Type Extractor

Create a script that scans the API directory and extracts types:

```typescript
// scripts/generate-router-types.ts
import * as fs from "fs"
import * as path from "path"
import * as ts from "typescript"

interface RouteDefinition {
  path: string
  methods: {
    method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH"
    requestType?: string    // From AuthenticatedMedusaRequest<T>
    responseType?: string   // From MedusaResponse<T>
  }[]
}

function scanRoutes(apiDir: string): RouteDefinition[] {
  const routes: RouteDefinition[] = []

  function walkDir(dir: string, routePath: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Convert [id] to :id for path params
        const segment = entry.name.startsWith("[") && entry.name.endsWith("]")
          ? `:${entry.name.slice(1, -1)}`
          : entry.name
        walkDir(path.join(dir, entry.name), `${routePath}/${segment}`)
      } else if (entry.name === "route.ts") {
        const methods = extractMethodsFromRoute(path.join(dir, entry.name))
        routes.push({ path: routePath || "/", methods })
      }
    }
  }

  walkDir(apiDir)
  return routes
}

function extractMethodsFromRoute(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  )

  const methods: RouteDefinition["methods"] = []

  // Find exported const declarations (GET, POST, DELETE, etc.)
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      )
      if (!isExported) return

      for (const decl of node.declarationList.declarations) {
        const name = decl.name.getText()
        if (["GET", "POST", "DELETE", "PUT", "PATCH"].includes(name)) {
          // Extract types from arrow function parameters
          const { requestType, responseType } = extractTypesFromHandler(decl)
          methods.push({
            method: name as any,
            requestType,
            responseType,
          })
        }
      }
    }
  })

  return methods
}
```

### Step 2: Generated AppRouter Type Structure

The script should output a type file:

```typescript
// packages/core/src/api/.generated/router.ts

import { HttpTypes } from "@mercurjs/types"
import type {
  VendorCreateProductType,
  VendorUpdateProductType,
  VendorGetProductsParamsType,
  // ... all validator types
} from "../vendor/products/validators"

export interface AppRouter {
  vendor: {
    products: {
      GET: {
        query: VendorGetProductsParamsType
        response: HttpTypes.VendorProductListResponse
      }
      POST: {
        body: VendorCreateProductType
        response: HttpTypes.VendorProductResponse
      }
    }
    "products/:id": {
      GET: {
        query: VendorGetProductParamsType
        response: HttpTypes.VendorProductResponse
      }
      POST: {
        body: VendorUpdateProductType
        response: HttpTypes.VendorProductResponse
      }
      DELETE: {
        response: HttpTypes.VendorDeleteResponse
      }
    }
    "products/:id/variants": {
      GET: {
        query: VendorGetProductVariantsParamsType
        response: HttpTypes.VendorProductVariantListResponse
      }
      POST: {
        body: VendorCreateProductVariantType
        response: HttpTypes.VendorProductVariantResponse
      }
    }
    // ... more routes
  }
  admin: {
    sellers: {
      GET: { ... }
      POST: { ... }
    }
    // ... more routes
  }
  store: {
    // ... store routes
  }
}
```

### Step 3: Route Export Pattern

Add exports to each route file for type extraction:

```typescript
// /api/vendor/products/route.ts

// Add explicit type exports for the generator
export type Route = {
  GET: {
    query: VendorGetProductsParamsType
    response: HttpTypes.VendorProductListResponse
  }
  POST: {
    body: VendorCreateProductType
    response: HttpTypes.VendorProductResponse
  }
}

// Existing handlers remain the same
export const GET = async (...) => { ... }
export const POST = async (...) => { ... }
```

### Step 4: Aggregate Router Type

Create an index that aggregates all route types:

```typescript
// /api/vendor/index.ts
export type { Route as ProductsRoute } from "./products/route"
export type { Route as ProductsIdRoute } from "./products/[id]/route"
// ...

// /api/index.ts
import type * as Vendor from "./vendor"
import type * as Admin from "./admin"
import type * as Store from "./store"

export interface AppRouter {
  vendor: {
    products: Vendor.ProductsRoute
    "products/:id": Vendor.ProductsIdRoute
    // ...
  }
  admin: { ... }
  store: { ... }
}
```

## Alternative: Automatic Type Inference

Instead of manual exports, use TypeScript's type inference:

```typescript
// scripts/infer-router-types.ts

// Read route.ts files and extract types from function signatures
// using TypeScript compiler API

import * as ts from "typescript"

function getRouteTypes(routeFile: string) {
  const program = ts.createProgram([routeFile], {})
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(routeFile)

  const types: Record<string, { request?: string; response?: string }> = {}

  ts.forEachChild(sourceFile!, (node) => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        const name = decl.name.getText()
        if (["GET", "POST", "DELETE"].includes(name) && decl.initializer) {
          const type = checker.getTypeAtLocation(decl.initializer)
          const signature = type.getCallSignatures()[0]

          if (signature) {
            const params = signature.getParameters()
            // Extract req and res parameter types
            const reqType = checker.getTypeOfSymbolAtLocation(params[0], node)
            const resType = checker.getTypeOfSymbolAtLocation(params[1], node)

            // Get generic type arguments
            // AuthenticatedMedusaRequest<T> -> T
            // MedusaResponse<T> -> T
            types[name] = {
              request: extractGenericArg(reqType),
              response: extractGenericArg(resType),
            }
          }
        }
      }
    }
  })

  return types
}
```

## Recommended Implementation

### Option A: Build-Time Generation (Recommended)

1. Add a build script that scans `/api` and generates `router.d.ts`
2. Run before TypeScript compilation
3. Import generated types in React panels

```json
// package.json
{
  "scripts": {
    "generate:router": "ts-node scripts/generate-router-types.ts",
    "build": "npm run generate:router && tsc"
  }
}
```

### Option B: TypeScript Plugin

Create a TypeScript plugin that generates types on-the-fly (like Next.js does):

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      { "name": "@mercurjs/router-types-plugin" }
    ]
  }
}
```

## Client Usage with Generated Types

```typescript
// React panel usage
import type { AppRouter } from "@/api/.generated/router"
import { createClient } from "./client"

const client = createClient<AppRouter>({ baseUrl: "/api" })

// Full type inference
const products = await client.vendor.products.GET({
  query: { limit: 10, q: "shirt" }  // ✅ Type-checked
})
// products is typed as HttpTypes.VendorProductListResponse

const newProduct = await client.vendor.products.POST({
  body: { title: "New Product", ... }  // ✅ Type-checked
})
// newProduct is typed as HttpTypes.VendorProductResponse
```

## Key Files to Scan

```
/packages/core/src/api/
├── vendor/
│   ├── products/route.ts              → vendor.products
│   ├── products/[id]/route.ts         → vendor["products/:id"]
│   ├── products/[id]/variants/route.ts
│   ├── orders/route.ts
│   ├── inventory-items/route.ts
│   └── ...
├── admin/
│   ├── sellers/route.ts               → admin.sellers
│   ├── commission-rates/route.ts
│   └── ...
└── store/
    ├── sellers/route.ts               → store.sellers
    └── ...
```

## Type Extraction Points

For each `route.ts`, extract:

| Source | Extract |
|--------|---------|
| `AuthenticatedMedusaRequest<T>` | Request body type `T` |
| `MedusaResponse<T>` | Response type `T` |
| Corresponding `validators.ts` | Query params type |

The generated `AppRouter` type becomes the single source of truth for your API client.
