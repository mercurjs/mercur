import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useApiKey } from "../../../hooks/api/api-keys"
import { ApiKeyType } from "../common/constants"
import { ApiKeyGeneralSection } from "./components/api-key-general-section"
import { ApiKeySalesChannelSection } from "./components/api-key-sales-channel-section"
import { apiKeyLoader } from "./loader"

const ALLOWED_TYPES = [ApiKeyGeneralSection, ApiKeySalesChannelSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof apiKeyLoader>
  >

  const { id } = useParams()

  const { api_key, isLoading, isError, error } = useApiKey(id!, undefined, {
    initialData,
  })

  if (isLoading || !api_key) {
    return <SingleColumnPageSkeleton showJSON sections={1} />
  }

  if (isError) {
    throw error
  }

  const isPublishable = api_key.type === ApiKeyType.PUBLISHABLE

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage
      hasOutlet
      showJSON
      data={api_key}
      data-testid={`${api_key.type}-api-key-detail-page`}
    >
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage
      hasOutlet
      showJSON
      data={api_key}
      data-testid={`${api_key.type}-api-key-detail-page`}
    >
      <ApiKeyGeneralSection apiKey={api_key} />
      {isPublishable && <ApiKeySalesChannelSection apiKey={api_key} />}
    </SingleColumnPage>
  )
}

export const ApiKeyManagementDetailPage = Object.assign(Root, {
  GeneralSection: ApiKeyGeneralSection,
  SalesChannelSection: ApiKeySalesChannelSection,
})
