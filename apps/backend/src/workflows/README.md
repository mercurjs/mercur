# Custom Workflows

A workflow is a series of queries and actions that complete a task.

The workflow is created in a TypeScript or JavaScript file under the `src/workflows` directory.

For example:

```ts
import {
  StepResponse,
  createStep,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

const step1 = createStep('step-1', async () => {
  return new StepResponse(`Hello from step one!`)
})

type WorkflowInput = {
  name: string
}

const step2 = createStep('step-2', async ({ name }: WorkflowInput) => {
  return new StepResponse(`Hello ${name} from step two!`)
})

type WorkflowOutput = {
  message: string
}

const myWorkflow = createWorkflow<WorkflowInput, WorkflowOutput>(
  'hello-world',
  function (input) {
    const str1 = step1()
    // to pass input
    step2(input)

    return {
      message: str1
    }
  }
)

export default myWorkflow
```

## Execute Workflow

You can execute the workflow from other resources, such as API routes, scheduled jobs, or subscribers.

For example, to execute the workflow in an API route:

```ts
import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import myWorkflow from '../../../workflows/hello-world'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await myWorkflow(req.scope).run({
    input: {
      name: req.query.name as string
    }
  })

  res.send(result)
}
```
