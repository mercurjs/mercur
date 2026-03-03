import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useUser } from "../../../hooks/api/users"
import { UserGeneralSection } from "./components/user-general-section"
import { userLoader } from "./loader"

const ALLOWED_TYPES = [UserGeneralSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof userLoader>>

  const { id } = useParams()
  const {
    user,
    isPending: isLoading,
    isError,
    error,
  } = useUser(id!, undefined, {
    initialData,
  })

  if (isLoading || !user) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage data={user} showJSON showMetadata>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage data={user} showJSON showMetadata>
      <UserGeneralSection user={user} />
    </SingleColumnPage>
  )
}

export const UserDetailPage = Object.assign(Root, {
  GeneralSection: UserGeneralSection,
})
