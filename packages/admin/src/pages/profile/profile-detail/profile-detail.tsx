import { ReactNode, Children } from "react"

import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared"

import { useMe } from "../../../hooks/api/users"
import { ProfileGeneralSection } from "./components/profile-general-section"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
const Root = ({ children }: { children?: ReactNode }) => {
  const meQuery = useLinkQuery("user")
  const { user, isPending: isLoading, isError, error } = useMe(meQuery)

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage data-testid="profile-detail-page">
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage data-testid="profile-detail-page">
      <WidgetZone id="profile.detail.main" data={user}>
        <ProfileGeneralSection user={user} />
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ProfileDetailPage = Object.assign(Root, {
  GeneralSection: ProfileGeneralSection,
})
