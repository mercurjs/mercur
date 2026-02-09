import { useWorkflowExecution } from "@hooks/api"

import type { HttpTypes } from "@medusajs/types"
import type { UIMatch } from "react-router-dom"

type WorkflowExecutionDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminWorkflowExecutionResponse>

export const WorkflowExecutionDetailBreadcrumb = (
  props: WorkflowExecutionDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { workflow_execution } = useWorkflowExecution(id!, {
    initialData: props.data,
    enabled: Boolean(id),
  })

  if (!workflow_execution) {
    return null
  }

  const cleanId = workflow_execution.id.replace("wf_exec_", "")

  return <span>{cleanId}</span>
}
