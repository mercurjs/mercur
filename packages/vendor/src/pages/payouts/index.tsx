// Route: /payouts
import { SingleColumnPage } from "@components/layout/pages"
import { PayoutListTable } from "./_components/payout-list-table"

export const Component = () => {
  return (
    <SingleColumnPage hasOutlet={false}>
      <PayoutListTable />
    </SingleColumnPage>
  )
}
