import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { CommissionRateListTable } from "./components/commission-rate-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <CommissionRateListTable />}
    </SingleColumnPage>
  )
}

export const CommissionRateList = Object.assign(Root, {
  Table: CommissionRateListTable,
})
