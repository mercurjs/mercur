import { ReactNode, Children } from "react"

import { WidgetZone, useExtension } from "@mercurjs/dashboard-shared"

import { useMe } from "../../../../hooks/api"
import { SingleColumnPage } from "../../../../components/layout/pages"
import { ProfileGeneralSection } from "./components/profile-general-section"

const Root = ({ children }: { children?: ReactNode }) => {
  const memberLinks = useExtension().getLinks("member")
  const meQuery = memberLinks.length
    ? { fields: memberLinks.map((link) => `+member.${link}.*`).join(",") }
    : undefined

  const { seller_member } = useMe(meQuery)
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
