import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { useMe } from "../../../../hooks/api"
import { SingleColumnPage } from "../../../../components/layout/pages"
import { ProfileGeneralSection } from "./components/profile-general-section"

const Root = ({ children }: { children?: ReactNode }) => {
  const { seller_member } = useMe()
  const member = seller_member?.member

  return Children.count(children) > 0 ? (
    <SingleColumnPage>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage>
      <WidgetZone id="profile.detail.main" data={member}>
        <ProfileGeneralSection />
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ProfileDetailPage = Object.assign(Root, {
  GeneralSection: ProfileGeneralSection,
})
