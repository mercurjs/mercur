import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useUser } from "@hooks/api/users"
import { useExtension } from "@providers/extension-provider"
import { UserGeneralSection } from "./_components/user-general-section"
import { loader } from "./loader"

export const Component = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const { id } = useParams()
  const {
    user,
    isPending: isLoading,
    isError,
    error,
  } = useUser(id!, undefined, {
    initialData,
  })

  const { getWidgets } = useExtension()

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      data={user}
      showJSON
      showMetadata
      widgets={{
        after: getWidgets("user.details.after"),
        before: getWidgets("user.details.before"),
      }}
    >
      <UserGeneralSection user={user} />
    </SingleColumnPage>
  )
}

export { Breadcrumb } from "./breadcrumb"
export { loader } from "./loader"
