import {
  AdminInventoryItem,
  AdminStockLocation,
  HttpTypes,
} from "@medusajs/types"
import { Button, Text, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals"
import { useBatchInventoryItemLocationLevels } from "../../../../../../hooks/api/inventory"
import { sdk } from "../../../../../../lib/client"

import { useMemo, useState } from "react"
import { LocationItem } from "./location-item"
import { LocationSearchInput } from "./location-search-input"
import { InfiniteList } from "../../../../../../components/common/infinite-list/infinite-list"
import { useStockLocations } from "../../../../../../hooks/api/stock-locations"

type EditInventoryItemAttributeFormProps = {
  item: AdminInventoryItem
  locations: AdminStockLocation[]
}

export const ManageLocationsForm = ({
  item,
}: EditInventoryItemAttributeFormProps) => {
  const existingLocationLevels = useMemo(
    () => new Set(item.location_levels?.map((l) => l.location_id) ?? []),
    [item.location_levels]
  )

  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(
    existingLocationLevels
  )

  const { count } = useStockLocations({ limit: 1, fields: "id" })

  const handleLocationSelect = (locationId: string, selected: boolean) => {
    setSelectedLocationIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(locationId)
      } else {
        newSet.delete(locationId)
      }
      return newSet
    })
  }

  const { mutateAsync } = useBatchInventoryItemLocationLevels(item.id)

  const handleSubmit = async () => {
    const toCreate = Array.from(selectedLocationIds).filter(
      (id) => !existingLocationLevels.has(id)
    )

    const toDeleteLocations = Array.from(existingLocationLevels).filter(
      (id) => !selectedLocationIds.has(id)
    )

    const toDelete = toDeleteLocations
      .map((id) => item.location_levels?.find((l) => l.location_id === id)?.id)
      .filter(Boolean) as unknown as string[]

    await mutateAsync(
      {
        create: toCreate.map((location_id) => ({
          location_id,
        })),
        delete: toDelete,
      },
      {
        onSuccess: () => {
          toast.success(t("inventory.toast.updateLocations"))
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" data-testid="inventory-manage-locations-form">
      <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto" data-testid="inventory-manage-locations-form-body">
        <div className="text-ui-fg-subtle shadow-elevation-card-rest grid grid-rows-2 divide-y rounded-lg border" data-testid="inventory-manage-locations-form-item-info">
          <div className="grid grid-cols-2 divide-x" data-testid="inventory-manage-locations-form-item-title-row">
            <Text className="px-2 py-1.5" size="small" leading="compact" data-testid="inventory-manage-locations-form-item-title-label">
              {t("fields.title")}
            </Text>
            <Text className="px-2 py-1.5" size="small" leading="compact" data-testid="inventory-manage-locations-form-item-title-value">
              {item.title ?? "-"}
            </Text>
          </div>
          <div className="grid grid-cols-2 divide-x" data-testid="inventory-manage-locations-form-item-sku-row">
            <Text className="px-2 py-1.5" size="small" leading="compact" data-testid="inventory-manage-locations-form-item-sku-label">
              {t("fields.sku")}
            </Text>
            <Text className="px-2 py-1.5" size="small" leading="compact" data-testid="inventory-manage-locations-form-item-sku-value">
              {item.sku}
            </Text>
          </div>
        </div>
        <div className="flex flex-col" data-testid="inventory-manage-locations-form-header">
          <Text size="small" weight="plus" leading="compact" data-testid="inventory-manage-locations-form-header-title">
            {t("locations.domain")}
          </Text>
          <div className="text-ui-fg-subtle flex w-full justify-between" data-testid="inventory-manage-locations-form-header-info">
            <Text size="small" leading="compact" data-testid="inventory-manage-locations-form-header-label">
              {t("locations.selectLocations")}
            </Text>
            <Text size="small" leading="compact" data-testid="inventory-manage-locations-form-header-count">
              {"("}
              {t("general.countOfTotalSelected", {
                count: selectedLocationIds.size,
                total: count,
              })}
              {")"}
            </Text>
          </div>
        </div>

        <div data-testid="inventory-manage-locations-form-search-wrapper">
          <LocationSearchInput
            onSearchChange={setSearchQuery}
            placeholder={t("general.search")}
          />
        </div>

        <div className="min-h-0 flex-1" data-testid="inventory-manage-locations-form-locations-list">
          <InfiniteList<
            HttpTypes.AdminStockLocationListResponse,
            HttpTypes.AdminStockLocation,
            HttpTypes.AdminStockLocationListParams
          >
            queryKey={["stock-locations", searchQuery]}
            queryFn={async (params) => {
              const response = await sdk.admin.stockLocation.list({
                limit: params.limit,
                offset: params.offset,
                ...(searchQuery && { q: searchQuery }),
              })
              return response
            }}
            responseKey="stock_locations"
            renderItem={(location) => (
              <LocationItem
                selected={selectedLocationIds.has(location.id)}
                location={location}
                onSelect={(selected) =>
                  handleLocationSelect(location.id, selected)
                }
              />
            )}
            renderEmpty={() => (
              <div className="flex items-center justify-center py-8" data-testid="inventory-manage-locations-form-empty-state">
                <Text size="small" className="text-ui-fg-subtle" data-testid="inventory-manage-locations-form-empty-state-text">
                  {searchQuery
                    ? t("locations.noLocationsFound")
                    : t("locations.noLocationsFound")}
                </Text>
              </div>
            )}
            pageSize={20}
          />
        </div>
      </RouteDrawer.Body>
      <RouteDrawer.Footer data-testid="inventory-manage-locations-form-footer">
        <div className="flex items-center justify-end gap-x-2" data-testid="inventory-manage-locations-form-footer-actions">
          <RouteDrawer.Close asChild data-testid="inventory-manage-locations-form-cancel-button-wrapper">
            <Button variant="secondary" size="small" data-testid="inventory-manage-locations-form-cancel-button">
              {t("actions.cancel")}
            </Button>
          </RouteDrawer.Close>
          <Button onClick={handleSubmit} size="small" isLoading={false} data-testid="inventory-manage-locations-form-save-button">
            {t("actions.save")}
          </Button>
        </div>
      </RouteDrawer.Footer>
    </div>
  )
}
