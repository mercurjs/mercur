import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useApiKey } from "@hooks/api/api-keys"
import { useExtension } from "@providers/extension-provider"

import { ApiKeyType } from "../_common/constants"
import { ApiKeyGeneralSection } from "./_components/api-key-general-section"
import { ApiKeySalesChannelSection } from "./_components/api-key-sales-channel-section"
import { apiKeyLoader } from "./loader"

const ApiKeyManagementDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof apiKeyLoader>
  >

  const { id } = useParams()
  const { getWidgets } = useExtension()

  const { api_key, isLoading, isError, error } = useApiKey(id!, {
    initialData: initialData,
  })

  if (isLoading || !api_key) {
    return <SingleColumnPageSkeleton showJSON sections={1} />
  }

  const isPublishable = api_key?.type === ApiKeyType.PUBLISHABLE

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      hasOutlet
      showJSON
      widgets={{
        before: getWidgets("api_key.details.before"),
        after: getWidgets("api_key.details.after"),
      }}
      data={api_key}
      data-testid={`${api_key.type}-api-key-detail-page`}
    >
      <ApiKeyGeneralSection apiKey={api_key} />
      {isPublishable && <ApiKeySalesChannelSection apiKey={api_key} />}
    </SingleColumnPage>
  )
}

export const Component = ApiKeyManagementDetail
export { apiKeyLoader as loader } from "./loader"
export { ApiKeyManagementDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
