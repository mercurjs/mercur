import { useMe } from "@hooks/api/users"
import { ProfileGeneralSection } from "./_components/profile-general-section"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

const ProfileDetail = () => {
  const { user, isPending: isLoading, isError, error } = useMe()
  const { getWidgets } = useExtension()

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("profile.details.after"),
        before: getWidgets("profile.details.before"),
      }}
      data-testid="profile-detail-page"
    >
      <ProfileGeneralSection user={user} />
    </SingleColumnPage>
  )
}

export const Component = ProfileDetail;
