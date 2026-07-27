import { useMemo } from "react"
import i18n from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "@medusajs/ui"
import { ClientError } from "@mercurjs/client"
import { useFeatureFlag } from "../providers/feature-flag-provider"
import {
  useViewConfigurations as useViewConfigurationsBase,
  useActiveViewConfiguration as useActiveViewConfigurationBase,
  useCreateViewConfiguration as useCreateViewConfigurationBase,
  useUpdateViewConfiguration as useUpdateViewConfigurationBase,
  useDeleteViewConfiguration as useDeleteViewConfigurationBase,
  useSetActiveViewConfiguration as useSetActiveViewConfigurationBase,
} from "./api/views"

// Common error handler
const handleError = (error: Error, message?: string) => {
  let errorMessage = message
  if (!errorMessage) {
    if (error instanceof ClientError) {
      errorMessage = error.message
    } else if (error.message) {
      errorMessage = error.message
    } else {
      errorMessage = i18n.t("errorBoundary.defaultTitle")
    }
  }

  toast.error(errorMessage)
}

export const useViewConfigurations = (entity: string) => {
  const { t } = useTranslation()
  const isViewConfigEnabled = useFeatureFlag("view_configurations")

  // List views
  const listViews = useViewConfigurationsBase(entity, { limit: 100 }, {
    enabled: isViewConfigEnabled && !!entity,
  })

  // Active view
  const activeView = useActiveViewConfigurationBase(entity, {
    enabled: isViewConfigEnabled && !!entity,
  })

  // Create view mutation
  const createView = useCreateViewConfigurationBase(entity, {
    onSuccess: () => {
      toast.success(t("views.toasts.created"))
    },
    onError: (error) => {
      handleError(error, t("views.toasts.createFailed"))
    },
  })

  // Set active view mutation
  const setActiveView = useSetActiveViewConfigurationBase(entity, {
    onSuccess: () => {
    },
    onError: (error) => {
      handleError(error, t("views.toasts.updateActiveFailed"))
    },
  })
  
  return useMemo(() => ({
    isViewConfigEnabled,
    listViews,
    activeView,
    createView,
    setActiveView,
    isDefaultViewActive: activeView?.is_default_active ?? true,
  }), [
    isViewConfigEnabled,
    listViews,
    activeView,
    createView,
    setActiveView,
  ])
}

// Hook for update/delete operations on a specific view
export const useViewConfiguration = (entity: string, viewId: string) => {
  const { t } = useTranslation()

  const updateView = useUpdateViewConfigurationBase(entity, viewId, {
    onSuccess: () => {
      toast.success(t("views.toasts.updated"))
    },
    onError: (error) => {
      handleError(error, t("views.toasts.updateFailed"))
    },
  })

  const deleteView = useDeleteViewConfigurationBase(entity, viewId, {
    onSuccess: () => {
      toast.success(t("views.toasts.deleted"))
    },
    onError: (error) => {
      handleError(error, t("views.toasts.deleteFailed"))
    },
  })

  return {
    updateView,
    deleteView,
  }
}
