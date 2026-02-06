import { useMe } from "../../../hooks/api/users"
import { ProfileGeneralSection } from "./components/profile-general-section"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"


export const ProfileDetail = () => {
  const { user, isPending: isLoading, isError, error } = useMe()

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
    >
      <ProfileGeneralSection user={user} />
    </SingleColumnPage>
  )
}
