import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { TaxRegionListView } from "./components/tax-region-list-view"

export const TaxRegionsList = () => {
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
