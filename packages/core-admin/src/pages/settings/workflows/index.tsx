import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { WorkflowExecutionListTable } from "./_components/workflow-execution-list-table"

export const nav = {
  id: "workflows",
  labelKey: "navigation.items.workflows",
  iconKey: "bolt",
  section: "settings",
  order: 30,
}

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
