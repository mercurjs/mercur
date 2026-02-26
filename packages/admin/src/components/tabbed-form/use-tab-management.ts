import { ProgressStatus } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"

import { TabDefinition } from "./types"

type TabState = Record<string, ProgressStatus>

/**
 * Validates fields for a specific tab. If the tab declares `validationFields`,
 * only those fields are validated. Otherwise falls back to full form validation.
 */
const validateTab = async <T extends FieldValues>(
  form: UseFormReturn<T>,
  tab: TabDefinition<T>
): Promise<boolean> => {
  if (tab.validationFields?.length) {
    return form.trigger(tab.validationFields as FieldPath<T>[])
  }
  return form.trigger()
}

/**
 * Validates all tabs from `fromIndex` to `toIndex` (inclusive) sequentially.
 * Returns false on the first tab that fails validation.
 */
const validateTabRange = async <T extends FieldValues>(
  form: UseFormReturn<T>,
  tabs: TabDefinition<T>[],
  fromIndex: number,
  toIndex: number
): Promise<boolean> => {

  for (let i = fromIndex; i <= toIndex; i++) {
    if (!(await validateTab(form, tabs[i]))) {
      return false
    }
  }
  return true
}

export const useTabManagement = <T extends FieldValues>({
  tabs,
  form,
}: {
  tabs: TabDefinition<T>[]
  form: UseFormReturn<T>
}) => {
  const visibleTabs = useMemo(
    () => tabs.filter((t) => !t.isVisible || t.isVisible(form)),
    [tabs, form]
  )

  const [activeTabId, setActiveTabId] = useState<string>(
    visibleTabs[0]?.id ?? ""
  )

  const [tabState, setTabState] = useState<TabState>(() => {
    const state: TabState = {}
    visibleTabs.forEach((t, i) => {
      state[t.id] = i === 0 ? "in-progress" : "not-started"
    })
    return state
  })

  useEffect(() => {
    let resolvedActiveId = activeTabId
    const activeExists = visibleTabs.some((t) => t.id === activeTabId)

    if (!activeExists && visibleTabs.length > 0) {
      resolvedActiveId = visibleTabs[0].id
      setActiveTabId(resolvedActiveId)
    }

    const newState: TabState = {}
    const resolvedIndex = visibleTabs.findIndex(
      (t) => t.id === resolvedActiveId
    )

    visibleTabs.forEach((t, i) => {
      if (i < resolvedIndex) {
        newState[t.id] = "completed"
      } else if (i === resolvedIndex) {
        newState[t.id] = "in-progress"
      } else {
        newState[t.id] = tabState[t.id] ?? "not-started"
      }
    })

    setTabState(newState)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want this effect to run when the active tab or visible tabs change
  }, [activeTabId, visibleTabs])

  const activeIndex = visibleTabs.findIndex((t) => t.id === activeTabId)
  const isLastTab = activeIndex === visibleTabs.length - 1

  const onNext = useCallback(async () => {
    const currentTab = visibleTabs[activeIndex]
    if (!currentTab) return

    const valid = await validateTab(form, currentTab)
    if (!valid) return

    if (activeIndex < visibleTabs.length - 1) {
      setActiveTabId(visibleTabs[activeIndex + 1].id)
    }
  }, [form, activeIndex, visibleTabs])

  const onTabChange = useCallback(
    async (tabId: string) => {
      const targetIndex = visibleTabs.findIndex((t) => t.id === tabId)
      if (targetIndex === -1) return

      const currentIndex = visibleTabs.findIndex(
        (t) => t.id === activeTabId
      )

      if (currentIndex === -1) {
        setActiveTabId(tabId)
        return
      }

      if (targetIndex <= currentIndex) {
        setActiveTabId(tabId)
        return
      }

      const valid = await validateTabRange(
        form,
        visibleTabs,
        currentIndex,
        targetIndex - 1
      )
      if (!valid) return

      setActiveTabId(tabId)
    },
    [form, visibleTabs, activeTabId]
  )

  return {
    activeTabId,
    setActiveTabId,
    tabState,
    visibleTabs,
    isLastTab,
    onNext,
    onTabChange,
  }
}
