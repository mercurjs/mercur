import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { TaxRegionListView } from "@pages/tax-regions/tax-region-list/components/tax-region-list-view"

const TaxRegionsList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("tax.list.before"),
        after: getWidgets("tax.list.after"),
      }}
      hasOutlet
    >
      <TaxRegionListView />
    </SingleColumnPage>
  )
}

export const Component = TaxRegionsList
