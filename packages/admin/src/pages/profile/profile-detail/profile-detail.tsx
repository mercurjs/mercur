import { ReactNode } from "react"

import { useMe } from "../../../hooks/api/users"
import { ProfileGeneralSection } from "./components/profile-general-section"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"

const ALLOWED_TYPES = [ProfileGeneralSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const { user, isPending: isLoading, isError, error } = useMe()

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage data-testid="profile-detail-page">
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage data-testid="profile-detail-page">
      <ProfileGeneralSection user={user} />
    </SingleColumnPage>
  )
}

export const ProfileDetailPage = Object.assign(Root, {
  GeneralSection: ProfileGeneralSection,
})
