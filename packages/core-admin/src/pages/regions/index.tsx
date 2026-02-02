import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { RegionListTable } from "./_components/region-list-table"

const RegionList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("region.list.before"),
        after: getWidgets("region.list.after"),
      }}
    >
      <RegionListTable />
    </SingleColumnPage>
  )
}

export const Component = RegionList
