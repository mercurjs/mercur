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
