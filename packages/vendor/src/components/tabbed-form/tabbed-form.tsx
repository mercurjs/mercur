import { Button, ProgressTabs } from "@medusajs/ui"
import {
  Children,
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useMemo,
} from "react"
import { FieldValues, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { RouteFocusModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"

import { TabDefinition } from "./types"
import { useTabManagement } from "./use-tab-management"

const TabbedFormContext = createContext<UseFormReturn<any> | null>(null)

export const useTabbedForm = <T extends FieldValues = FieldValues>() => {
  const form = useContext(TabbedFormContext)
  if (!form) {
    throw new Error("useTabbedForm must be used within a TabbedForm")
  }
  return form as UseFormReturn<T>
}

function resolveTabMeta<T extends FieldValues>(
  child: ReactElement
): TabDefinition<T> | null {
  const type = child.type as any
  const meta: TabDefinition<T> | undefined = type?._tabMeta

  if (!meta && !child.props?.id) {
    return null
  }

  return {
    id: child.props?.id ?? meta?.id ?? "",
    labelKey: meta?.labelKey ?? "",
    label: child.props?.label,
    validationFields: child.props?.validationFields ?? meta?.validationFields,
    isVisible: child.props?.isVisible ?? meta?.isVisible,
  }
}

function collectTabs<T extends FieldValues>(children: ReactNode): {
  tabs: TabDefinition<T>[]
  elements: ReactElement[]
} {
  const tabs: TabDefinition<T>[] = []
  const elements: ReactElement[] = []

  Children.forEach(children, (child) => {
    if (!child || typeof child !== "object" || !("type" in child)) {
      return
    }

    const meta = resolveTabMeta<T>(child as ReactElement)
    if (meta) {
      tabs.push(meta)
      elements.push(child as ReactElement)
    }
  })

  return { tabs, elements }
}

type FooterRenderProps = {
  isLastTab: boolean
  onNext: () => void
  isLoading?: boolean
}

type TabbedFormProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  onSubmit: (e?: React.BaseSyntheticEvent) => void
  children: ReactNode
  isLoading?: boolean
  footer?: (props: FooterRenderProps) => ReactNode
  transformTabs?: (tabs: TabDefinition<T>[]) => TabDefinition<T>[]
}

function Root<T extends FieldValues>({
  form,
  onSubmit,
  children,
  isLoading,
  footer,
  transformTabs,
}: TabbedFormProps<T>) {
  const { t } = useTranslation()

  const { tabs: rawTabs, elements } = useMemo(
    () => collectTabs<T>(children),
    [children]
  )

  const tabs = useMemo(
    () => (transformTabs ? transformTabs(rawTabs) : rawTabs),
    [transformTabs, rawTabs]
  )

  const {
    activeTabId,
    tabState,
    visibleTabs,
    isLastTab,
    onNext,
    onTabChange,
  } = useTabManagement<T>({
    tabs,
    form,
  })

  const visibleElements = elements.filter((el) => {
    const meta = resolveTabMeta<T>(el)
    return meta && visibleTabs.some((vt) => vt.id === meta.id)
  })

  return (
    <TabbedFormContext.Provider value={form}>
      <RouteFocusModal.Form form={form}>
        <KeyboundForm
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (
                e.target instanceof HTMLTextAreaElement &&
                !(e.metaKey || e.ctrlKey)
              ) {
                return
              }

              e.preventDefault()

              if (e.metaKey || e.ctrlKey) {
                if (!isLastTab) {
                  e.preventDefault()
                  e.stopPropagation()
                  onNext()

                  return
                }

                onSubmit()
              }
            }
          }}
          onSubmit={onSubmit}
          className="flex h-full flex-col"
        >
          <ProgressTabs
            value={activeTabId}
            onValueChange={onTabChange}
            className="flex h-full flex-col overflow-hidden"
          >
            <RouteFocusModal.Header>
              <div className="-my-2 w-full border-l">
                <ProgressTabs.List className="justify-start-start flex w-full items-center">
                  {visibleTabs.map((tab) => (
                    <ProgressTabs.Trigger
                      key={tab.id}
                      status={tabState[tab.id] ?? "not-started"}
                      value={tab.id}
                      className="max-w-[200px] truncate"
                    >
                      {tab.label ?? t(tab.labelKey)}
                    </ProgressTabs.Trigger>
                  ))}
                </ProgressTabs.List>
              </div>
            </RouteFocusModal.Header>
            <RouteFocusModal.Body className="size-full overflow-hidden">
              {visibleElements.map((element) => {
                const meta = resolveTabMeta<T>(element)!
                return (
                  <ProgressTabs.Content
                    key={meta.id}
                    className="size-full overflow-y-auto"
                    value={meta.id}
                  >
                    {element}
                  </ProgressTabs.Content>
                )
              })}
            </RouteFocusModal.Body>
          </ProgressTabs>
          <RouteFocusModal.Footer>
            {footer ? (
              footer({ isLastTab, onNext, isLoading })
            ) : (
              <DefaultFooter
                isLastTab={isLastTab}
                onNext={onNext}
                isLoading={isLoading}
              />
            )}
          </RouteFocusModal.Footer>
        </KeyboundForm>
      </RouteFocusModal.Form>
    </TabbedFormContext.Provider>
  )
}

const DefaultFooter = ({
  isLastTab,
  onNext,
  isLoading,
}: FooterRenderProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-end gap-x-2">
      <RouteFocusModal.Close asChild>
        <Button variant="secondary" size="small">
          {t("actions.cancel")}
        </Button>
      </RouteFocusModal.Close>
      {isLastTab ? (
        <Button
          key="submit-button"
          type="submit"
          variant="primary"
          size="small"
          isLoading={isLoading}
        >
          {t("actions.save")}
        </Button>
      ) : (
        <Button
          key="next-button"
          type="button"
          variant="primary"
          size="small"
          onClick={() => onNext()}
        >
          {t("actions.continue")}
        </Button>
      )}
    </div>
  )
}

const Tab = ({
  children,
}: {
  id: string
  label: string
  children?: ReactNode
}) => {
  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        {children}
      </div>
    </div>
  )
}

export const TabbedForm = Object.assign(Root, { Tab, useForm: useTabbedForm })
