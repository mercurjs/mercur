import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import { LayoutComposer, useExtension } from "@mercurjs/dashboard-shared"

import { useMe } from "../../../../hooks/api"
import { ProfileGeneralSection } from "./components/profile-general-section"

export const ProfileDetailPage = () => {
  const memberLinks = useExtension().getLinks("member")
  const meQuery = memberLinks.length
    ? { fields: memberLinks.map((link) => `+member.${link}.*`).join(",") }
    : undefined

  const { seller_member } = useMe(meQuery)
  const member = seller_member?.member

  return (
    <LayoutComposer
      widgetsZonePrefix="profile.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={member}
      sections={{
        main: (
          <LayoutComposer.Entry id="ProfileGeneralSection">
            <ProfileGeneralSection />
          </LayoutComposer.Entry>
        ),
      }}
    />
  )
}
