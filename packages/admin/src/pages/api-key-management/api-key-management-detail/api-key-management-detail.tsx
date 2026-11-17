import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useApiKey } from "../../../hooks/api/api-keys"
import { ApiKeyType } from "../common/constants"
import { ApiKeyGeneralSection } from "./components/api-key-general-section"
import { ApiKeySalesChannelSection } from "./components/api-key-sales-channel-section"
import { apiKeyLoader } from "./loader"

export const ApiKeyManagementDetailPage = () => {
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

  return (
    <LayoutComposer
      widgetsZonePrefix="api-keys.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={api_key}
      data-testid={`${api_key.type}-api-key-detail-page`}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ApiKeyGeneralSection">
              <ApiKeyGeneralSection apiKey={api_key} />
            </LayoutComposer.Entry>
            {isPublishable && (
              <LayoutComposer.Entry id="ApiKeySalesChannelSection">
                <PermissionGuard permission="sales_channels:view">
                  <ApiKeySalesChannelSection apiKey={api_key} />
                </PermissionGuard>
              </LayoutComposer.Entry>
            )}
            {detailPageDefaultEntries(api_key, { metadata: false })}
          </>
        ),
      }}
    />
  )
}
