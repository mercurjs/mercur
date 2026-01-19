import { Registry, registryItemSchema } from '@mercurjs/cli'
import { z } from "zod"

const blocks = [
    {
        name: "block-1",
        description: "A block with a test module, product-test link, and API route.",
        dependencies: [
        ],
        registryDependencies: [],
        files: [
            {
                path: "block-1/modules/test/index.ts",
                type: "registry:file",
                target: "src/modules/test/index.ts",
            },
            {
                path: "block-1/modules/test/service.ts",
                type: "registry:file",
                target: "src/modules/test/service.ts",
            },
            {
                path: "block-1/modules/test/models/test.ts",
                type: "registry:file",
                target: "src/modules/test/models/test.ts",
            },
            {
                path: "block-1/links/product-test.ts",
                type: "registry:file",
                target: "src/links/product-test.ts",
            },
            {
                path: "block-1/api/hello/test/route.ts",
                type: "registry:file",
                target: "src/api/hello/test/route.ts",
            },
        ],
        categories: ["modules"],
    },
]


export const registry = {
    name: "shadcn/ui",
    homepage: "https://ui.shadcn.com",
    items: z.array(registryItemSchema).parse(
        blocks
    ),
} satisfies Registry