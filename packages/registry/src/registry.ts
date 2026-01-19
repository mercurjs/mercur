import { Registry, registryItemSchema } from '@mercurjs/cli'
import { z } from "zod"

const blocks: Registry['items'] = [
    {
        name: "block-1",
        description: "A block with a test module, product-test link, and API route.",
        dependencies: [],
        registryDependencies: [],
        files: [
            {
                path: "block-1/modules/test/index.ts",
                type: "registry:module",
                target: "src/modules/test/index.ts",
            },
            {
                path: "block-1/modules/test/service.ts",
                type: "registry:module",
                target: "src/modules/test/service.ts",
            },
            {
                path: "block-1/modules/test/models/test.ts",
                type: "registry:module",
                target: "src/modules/test/models/test.ts",
            },
            {
                path: "block-1/links/product-test.ts",
                type: "registry:link",
                target: "src/links/product-test.ts",
            },
            {
                path: "block-1/api/hello/test/route.ts",
                type: "registry:api",
                target: "src/api/hello/test/route.ts",
            },
        ],
        categories: ["test"],
    },
]


export const registry = {
    name: "@mercurjs",
    homepage: "https://mercurjs.com",
    items: z.array(registryItemSchema).parse(
        blocks
    ),
} satisfies Registry