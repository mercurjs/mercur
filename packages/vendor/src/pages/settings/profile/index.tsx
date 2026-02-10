import { useUserMe } from "@hooks/api/users"
import { ProfileGeneralSection } from "./_components/profile-general-section"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"

const ProfileDetail = () => {
  const { member, isPending: isLoading, isError, error } = useUserMe()
  const { getWidgets } = useDashboardExtension()

  if (isLoading || !member) {
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
    >
      <ProfileGeneralSection user={member} />
    </SingleColumnPage>
  )
}

export const Component = ProfileDetail
