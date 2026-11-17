import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import { LayoutComposer, useLinkQuery } from "@mercurjs/dashboard-shared"

import { useMe } from "../../../hooks/api/users"
import { ProfileGeneralSection } from "./components/profile-general-section"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"

export const ProfileDetailPage = () => {
  const meQuery = useLinkQuery("user")
  const { user, isPending: isLoading, isError, error } = useMe(meQuery)

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="profile.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={user}
      data-testid="profile-detail-page"
      sections={{
        main: (
          <LayoutComposer.Entry id="ProfileGeneralSection">
            <ProfileGeneralSection user={user} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  )
}
