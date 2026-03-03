import { Children, ReactNode } from "react"

import { useMe } from "../../../hooks/api/users"
import { ProfileGeneralSection } from "./components/profile-general-section"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"

const Root = ({ children }: { children?: ReactNode }) => {
  const { user, isPending: isLoading, isError, error } = useMe()

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage data-testid="profile-detail-page">
      {Children.count(children) > 0 ? children : (
        <ProfileGeneralSection user={user} />
      )}
    </SingleColumnPage>
  )
}

export const ProfileDetail = Object.assign(Root, {
  GeneralSection: ProfileGeneralSection,
})
