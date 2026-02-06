import { WorkflowExecutionListTable } from "./components/workflow-execution-list-table"

import { SingleColumnPage } from "../../../components/layout/pages"


export const WorkflowExcecutionList = () => {

  return (
    <SingleColumnPage
      hasOutlet={false}
    >
      <WorkflowExecutionListTable />
    </SingleColumnPage>
  )
}
