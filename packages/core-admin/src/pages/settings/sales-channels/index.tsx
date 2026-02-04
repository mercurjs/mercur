import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { SalesChannelListTable } from "./_components/sales-channel-list-table"

export const nav = {
  id: "sales-channels",
  labelKey: "navigation.items.salesChannels",
  iconKey: "buildings",
  section: "settings",
  order: 20,
}

const SalesChannelList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("sales_channel.list.before"),
        after: getWidgets("sales_channel.list.after"),
      }}
      hasOutlet
    >
      <SalesChannelListTable />
    </SingleColumnPage>
  )
}

export const Component = SalesChannelList
