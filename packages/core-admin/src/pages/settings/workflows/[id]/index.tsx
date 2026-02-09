import { useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useWorkflowExecution } from "@hooks/api/workflow-executions"
import { useExtension } from "@providers/extension-provider"

import { WorkflowExecutionGeneralSection } from "./_components/workflow-execution-general-section"
import { WorkflowExecutionHistorySection } from "./_components/workflow-execution-history-section"
import { WorkflowExecutionPayloadSection } from "./_components/workflow-execution-payload-section"
import { WorkflowExecutionTimelineSection } from "./_components/workflow-execution-timeline-section"

const ExecutionDetail = () => {
  const { id } = useParams()

  const { workflow_execution, isLoading, isError, error } =
    useWorkflowExecution(id!)

  const { getWidgets } = useExtension()

  if (isLoading || !workflow_execution) {
    return <SingleColumnPageSkeleton sections={4} showJSON />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("workflow.details.after"),
        before: getWidgets("workflow.details.before"),
      }}
      data={workflow_execution}
      showJSON
      data-testid="workflow-detail-page"
    >
      <WorkflowExecutionGeneralSection execution={workflow_execution} />
      <WorkflowExecutionTimelineSection execution={workflow_execution} />
      <WorkflowExecutionPayloadSection execution={workflow_execution} />
      <WorkflowExecutionHistorySection execution={workflow_execution} />
    </SingleColumnPage>
  )
}

export const Component = ExecutionDetail
export { workflowExecutionLoader as loader } from "./loader"
export { WorkflowExecutionDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
