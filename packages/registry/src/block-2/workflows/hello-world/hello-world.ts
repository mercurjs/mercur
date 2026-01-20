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

type WorkflowOutput = {
  message1: string
  message2: string
}

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
