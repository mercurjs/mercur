import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { WorkflowExecutionListTable } from "./_components/workflow-execution-list-table"

const WorkflowExecutionList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("workflow.list.after"),
        before: getWidgets("workflow.list.before"),
      }}
      hasOutlet={false}
      data-testid="workflows-list-page"
    >
      <WorkflowExecutionListTable />
    </SingleColumnPage>
  )
}

export const Component = WorkflowExecutionList
