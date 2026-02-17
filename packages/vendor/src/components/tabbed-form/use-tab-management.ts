import { ProgressStatus } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FieldValues, UseFormReturn } from "react-hook-form"

import { TabDefinition } from "./types"

type TabState = Record<string, ProgressStatus>

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
    const newState: TabState = {}
    const activeIndex = visibleTabs.findIndex((t) => t.id === activeTabId)

    visibleTabs.forEach((t, i) => {
      if (i < activeIndex) {
        newState[t.id] = "completed"
      } else if (i === activeIndex) {
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
    const valid = await form.trigger()

    if (!valid) {
      return
    }

    if (activeIndex < visibleTabs.length - 1) {
      setActiveTabId(visibleTabs[activeIndex + 1].id)
    }
  }, [form, activeIndex, visibleTabs])

  const onTabChange = useCallback(
    async (tabId: string) => {
      const valid = await form.trigger()

      if (!valid) {
        return
      }

      setActiveTabId(tabId)
    },
    [form]
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
