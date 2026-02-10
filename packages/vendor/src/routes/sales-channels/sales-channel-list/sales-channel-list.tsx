import { SalesChannelListTable } from "./components/sales-channel-list-table"

import { SingleColumnPage } from "../../../components/layout/pages"


export const SalesChannelList = () => {

  return (
    <SingleColumnPage
      hasOutlet
    >
      <SalesChannelListTable />
    </SingleColumnPage>
  )
}
