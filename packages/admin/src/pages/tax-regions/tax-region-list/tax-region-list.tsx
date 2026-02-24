import { SingleColumnPage } from "../../../components/layout/pages"
import { TaxRegionListView } from "./components/tax-region-list-view"

export const TaxRegionsList = () => {
  return (
    <SingleColumnPage
      hasOutlet
    >
      <TaxRegionListView />
    </SingleColumnPage>
  )
}
