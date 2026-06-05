import { Children, ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { TeamListHeader } from "./team-list-header"
import { TeamListDataTable } from "./team-list-data-table"

export { TeamListDataTable } from "./team-list-data-table"
export {
  TeamListHeader,
  TeamListTitle,
  TeamListActions,
} from "./team-list-header"

export const TeamListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <TeamListHeader />
          <TeamListDataTable />
        </>
      )}
    </Container>
  )
}
