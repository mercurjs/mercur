import { ProgressTabs } from "@medusajs/ui"
import { ReactNode, Children } from "react"
import { useTranslation } from "react-i18next"

import { RouteFocusModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useDocumentDirection } from "@hooks/use-document-direction"

import { ProductCreateTab, useProductCreateContext } from "./product-create-context"
import { DetailsTab } from "./product-create-details-tab"
import { OrganizeTab } from "./product-create-organize-tab"
import { VariantsTab } from "./product-create-variants-tab"
import { InventoryTab } from "./product-create-inventory-tab"
import { Footer } from "./product-create-footer"

interface FormProps {
  children?: ReactNode
}

export function Form({ children }: FormProps) {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const {
    form,
    tab,
    setTab,
    tabState,
    onNext,
    handleSubmit,
    showInventoryTab,
  } = useProductCreateContext()

  const hasCustomChildren = Children.count(children) > 0

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        data-testid="product-create-form"
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
              if (tab !== ProductCreateTab.VARIANTS) {
                e.preventDefault()
                e.stopPropagation()
                onNext(tab)
                return
              }
              handleSubmit()
            }
          }
        }}
        onSubmit={handleSubmit}
        className="flex h-full flex-col"
      >
        <ProgressTabs
          dir={direction}
          value={tab}
          onValueChange={async (tab) => {
            const valid = await form.trigger()
            if (!valid) {
              return
            }
            setTab(tab as ProductCreateTab)
          }}
          className="flex h-full flex-col overflow-hidden"
          data-testid="product-create-form-tabs"
        >
          <RouteFocusModal.Header>
            <div
              className="-my-2 w-full border-l"
              data-testid="product-create-form-tabs-header"
            >
              <ProgressTabs.List
                className="justify-start-start flex w-full items-center"
                data-testid="product-create-form-tabs-list"
              >
                <ProgressTabs.Trigger
                  status={tabState[ProductCreateTab.DETAILS]}
                  value={ProductCreateTab.DETAILS}
                  className="max-w-[200px] truncate"
                  data-testid="product-create-form-tab-details"
                >
                  {t("products.create.tabs.details")}
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  status={tabState[ProductCreateTab.ORGANIZE]}
                  value={ProductCreateTab.ORGANIZE}
                  className="max-w-[200px] truncate"
                  data-testid="product-create-form-tab-organize"
                >
                  {t("products.create.tabs.organize")}
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  status={tabState[ProductCreateTab.VARIANTS]}
                  value={ProductCreateTab.VARIANTS}
                  className="max-w-[200px] truncate"
                  data-testid="product-create-form-tab-variants"
                >
                  {t("products.create.tabs.variants")}
                </ProgressTabs.Trigger>
                {showInventoryTab && (
                  <ProgressTabs.Trigger
                    status={tabState[ProductCreateTab.INVENTORY]}
                    value={ProductCreateTab.INVENTORY}
                    className="max-w-[200px] truncate"
                    data-testid="product-create-form-tab-inventory"
                  >
                    {t("products.create.tabs.inventory")}
                  </ProgressTabs.Trigger>
                )}
              </ProgressTabs.List>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body
            className="size-full overflow-hidden"
            data-testid="product-create-form-body"
          >
            {hasCustomChildren ? (
              children
            ) : (
              <>
                <ProgressTabs.Content
                  className="size-full overflow-y-auto"
                  value={ProductCreateTab.DETAILS}
                  data-testid="product-create-form-tab-content-details"
                >
                  <DetailsTab />
                </ProgressTabs.Content>
                <ProgressTabs.Content
                  className="size-full overflow-y-auto"
                  value={ProductCreateTab.ORGANIZE}
                  data-testid="product-create-form-tab-content-organize"
                >
                  <OrganizeTab />
                </ProgressTabs.Content>
                <ProgressTabs.Content
                  className="size-full overflow-y-auto"
                  value={ProductCreateTab.VARIANTS}
                  data-testid="product-create-form-tab-content-variants"
                >
                  <VariantsTab />
                </ProgressTabs.Content>
                {showInventoryTab && (
                  <ProgressTabs.Content
                    className="size-full overflow-y-auto"
                    value={ProductCreateTab.INVENTORY}
                    data-testid="product-create-form-tab-content-inventory"
                  >
                    <InventoryTab />
                  </ProgressTabs.Content>
                )}
              </>
            )}
          </RouteFocusModal.Body>
        </ProgressTabs>
        <Footer />
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
