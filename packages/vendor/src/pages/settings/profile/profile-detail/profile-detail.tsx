import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../../components/layout/pages"
import { ProfileGeneralSection } from "./components/profile-general-section"

const Root = ({ children }: { children?: ReactNode }) => {
  return Children.count(children) > 0 ? (
    <SingleColumnPage>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage>
      <ProfileGeneralSection />
    </SingleColumnPage>
  )
}

export const ProfileDetailPage = Object.assign(Root, {
  GeneralSection: ProfileGeneralSection,
})
