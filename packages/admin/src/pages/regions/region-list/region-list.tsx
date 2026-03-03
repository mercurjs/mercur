import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { RegionListTable } from "./components/region-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <RegionListTable />}
    </SingleColumnPage>
  )
}

export const RegionList = Object.assign(Root, {
  Table: RegionListTable,
})
