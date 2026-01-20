# Mercur Registry Template

A template repo to create a [Mercur](https://mercurjs.com) registry with reusable blocks.

Mercur is built with a robust infrastructure intended to support Blocks with ease. This provides a simple, modular, and reusable way for developers to extend the core capabilities of Mercur.

To build your own Mercur blocks, all you need is:

- An understanding of the basic Medusa/Mercur concepts
- And some JavaScript/Typescript experience

## Background

Here is a short recap on how blocks work with Mercur, to learn more visit the [Mercur documentation](https://docs.mercurjs.com).

### How to install a block

To install any block, simply use the Mercur CLI:

```bash
npx @mercurjs/cli add block-name
```

### Block Types

Blocks can contain various types of resources:

- **Modules** - Custom business logic and data models
- **Links** - Relationships between modules
- **Workflows** - Multi-step business processes
- **API Routes** - Custom HTTP endpoints
- **Admin Extensions** - Dashboard customizations
- **Vendor Extensions** - Vendor portal customizations

## Building Blocks

When you build a block, you are purely building a feature for your project and then abstracting it outside of the project.

### Template Files

In this template, you will see a common file structure that is used across all registries:

1. root folder
2. /src folder

#### Root

In the root folder, you will see various files that relate to the configuration of the registry:

- **README.md**\* - This contains instructions on how to use the template. When you are ready, update this to contain instructions on how to use your blocks.
- **package.json**\* - Contains necessary scripts and dependencies. Overwrite the metadata in this file to describe your registry.
- **registry.json**\* - Defines all blocks, their files, dependencies, and documentation.
- **blocks.json** - Configures path aliases for block resources.
- **tsconfig.json** - Configures the compiler options for TypeScript.
- **.gitignore** - List specific untracked files to omit from Git.

**IMPORTANT\***: You will need to modify these files.

#### Src

The src folder contains your blocks. Each block should be in its own directory:

```
src/
├── block-1/
│   ├── modules/
│   ├── links/
│   ├── api/
│   └── workflows/
└── block-2/
    ├── modules/
    ├── links/
    ├── api/
    └── workflows/
```

##### Modules

Modules define your data models and business logic:

```ts
// modules/sample/models/sample.ts
import { model } from "@medusajs/framework/utils"

const Sample = model.define("sample", {
  id: model.id().primaryKey(),
  name: model.text(),
})

export default Sample
```

```ts
// modules/sample/service.ts
import { MedusaService } from "@medusajs/framework/utils"
import Sample from "./models/sample"

class SampleModuleService extends MedusaService({
  Sample,
}) {}

export default SampleModuleService
```

```ts
// modules/sample/index.ts
import { Module } from "@medusajs/framework/utils"
import SampleModuleService from "./service"

export const SAMPLE_MODULE = "sample"

export default Module(SAMPLE_MODULE, {
  service: SampleModuleService,
})
```

##### Links

Links define relationships between modules:

```ts
// links/product-sample.ts
import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import SampleModule from "../modules/sample"

export default defineLink(
  ProductModule.linkable.product,
  SampleModule.linkable.sample
)
```

##### Workflows

Workflows define multi-step business processes:

```ts
// workflows/hello-world/hello-world.ts
import {
  createStep,
  createWorkflow,
  WorkflowResponse,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

const step1 = createStep("step-1", async () => {
  return new StepResponse(`Hello from step one!`)
})

type WorkflowInput = {
  name: string
}

const step2 = createStep(
  "step-2",
  async ({ name }: WorkflowInput) => {
    return new StepResponse(`Hello ${name} from step two!`)
  }
)

const helloWorldWorkflow = createWorkflow(
  "hello-world",
  (input: WorkflowInput) => {
    const greeting1 = step1()
    const greeting2 = step2(input)

    return new WorkflowResponse({
      message1: greeting1,
      message2: greeting2,
    })
  }
)

export default helloWorldWorkflow
```

##### API Routes

API routes expose HTTP endpoints:

```ts
// api/hello/workflow/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import helloWorldWorkflow from "../../../workflows/hello-world/hello-world"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { result } = await helloWorldWorkflow(req.scope).run({
    input: {
      name: (req.query.name as string) || "World",
    },
  })

  res.json(result)
}
```

### Registry Configuration

The `registry.json` file defines your blocks:

```json
{
  "$schema": "https://raw.githubusercontent.com/mercurjs/mercur/new/packages/registry/public/schema/registry.json",
  "name": "@your-org",
  "homepage": "https://your-site.com",
  "items": [
    {
      "name": "my-block",
      "description": "A description of what this block does.",
      "dependencies": [],
      "registryDependencies": [],
      "docs": "## Configuration\n\nAdd documentation here...",
      "files": [
        {
          "path": "my-block/modules/sample/index.ts",
          "type": "registry:module"
        }
      ],
      "categories": ["sample"]
    }
  ]
}
```

#### Block Properties

- **name** - Unique identifier for the block
- **description** - Brief description of the block's purpose
- **dependencies** - NPM packages required by the block
- **registryDependencies** - Other blocks this block depends on
- **docs** - Markdown documentation shown during installation
- **files** - List of files included in the block
- **categories** - Tags for categorizing the block

#### File Types

- `registry:module` - Module files
- `registry:link` - Link definitions
- `registry:workflow` - Workflow files
- `registry:api` - API route files
- `registry:admin` - Admin extensions
- `registry:vendor` - Vendor extensions

## Development

1. Install dependencies:

```bash
npm install
```

2. Build TypeScript:

```bash
npm run build
```

3. Build registry:

```bash
npm run build:registry
```

## Best Practices

Here are best practices we follow when building blocks:

- **Keep blocks focused**: Each block should serve a single, well-defined purpose. This makes them easier to understand and maintain.
- **Document thoroughly**: Include clear documentation in the `docs` field explaining configuration, environment variables, and usage.
- **Declare dependencies**: Always list required NPM packages in `dependencies` and other blocks in `registryDependencies`.
- **Use meaningful names**: Choose descriptive names for blocks, modules, and files that clearly indicate their purpose.
- **Test your blocks**: Ensure blocks work correctly before publishing by testing them in a real Mercur project.
- **Version compatibility**: Document which versions of Medusa/Mercur your blocks are compatible with.
- **Publish to NPM**: Share your registry by publishing it as an NPM package for others to use.

## Questions

Please contact [Mercur](mailto:support@mercurjs.com) with any questions about using this registry template.
