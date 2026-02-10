import { zodResolver } from "@hookform/resolvers/zod"
import { AdminCreateProductVariantPrice, HttpTypes } from "@medusajs/types"
import { Button, ProgressTabs } from "@medusajs/ui"
import { ReactNode, Children, useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { z } from "zod"

import {
  RouteDrawer,
  RouteFocusModal,
  useRouteModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useRegions } from "@hooks/api"
import { useProduct, useCreateProductVariant } from "@hooks/api/products"
import { useDocumentDirection } from "@hooks/use-document-direction"
import { castNumber } from "@lib/cast-number"
import { partialFormValidation } from "@lib/validation"

import {
  CreateProductVariantSchema,
  CreateVariantDetailsFields,
  CreateVariantDetailsSchema,
  CreateVariantPriceFields,
  CreateVariantPriceSchema,
} from "./create-product-variant-form/constants"
import DetailsTab from "./create-product-variant-form/details-tab"
import InventoryKitTab from "./create-product-variant-form/inventory-kit-tab"
import PricingTab from "./create-product-variant-form/pricing-tab"

import {
  VariantCreateTab,
  VariantCreateTabState,
  VariantCreateContextValue,
  VariantCreateProvider,
  useVariantCreateContext,
} from "./variant-create-context"

// ─── Tab Sub-Components ──────────────────────────────────────

function VariantDetailsTab() {
  const { form, product } = useVariantCreateContext()
  return <DetailsTab form={form} product={product} />
}

function VariantPricingTab() {
  const { form } = useVariantCreateContext()
  return <PricingTab form={form} />
}

function VariantInventoryTab() {
  const { form } = useVariantCreateContext()
  return <InventoryKitTab form={form} />
}

// ─── Footer ──────────────────────────────────────────────────

function Footer() {
  const { t } = useTranslation()
  const { tab, handleNextTab, isPending, inventoryTabEnabled } =
    useVariantCreateContext()

  return (
    <RouteFocusModal.Footer data-testid="product-variant-create-form-footer">
      <div className="flex items-center justify-end gap-x-2">
        <RouteDrawer.Close asChild>
          <Button
            variant="secondary"
            size="small"
            data-testid="product-variant-create-form-cancel-button"
          >
            {t("actions.cancel")}
          </Button>
        </RouteDrawer.Close>
        <PrimaryButton
          tab={tab}
          next={handleNextTab}
          isLoading={isPending}
          inventoryTabEnabled={inventoryTabEnabled}
        />
      </div>
    </RouteFocusModal.Footer>
  )
}

type PrimaryButtonProps = {
  tab: VariantCreateTab
  next: (tab: VariantCreateTab) => void
  isLoading?: boolean
  inventoryTabEnabled: boolean
}

const PrimaryButton = ({
  tab,
  next,
  isLoading,
  inventoryTabEnabled,
}: PrimaryButtonProps) => {
  const { t } = useTranslation()

  if (
    (inventoryTabEnabled && tab === VariantCreateTab.INVENTORY) ||
    (!inventoryTabEnabled && tab === VariantCreateTab.PRICE)
  ) {
    return (
      <Button
        key="submit-button"
        type="submit"
        variant="primary"
        size="small"
        isLoading={isLoading}
        data-testid="product-variant-create-form-save-button"
      >
        {t("actions.save")}
      </Button>
    )
  }

  return (
    <Button
      key="next-button"
      type="button"
      variant="primary"
      size="small"
      onClick={() => next(tab)}
      data-testid="product-variant-create-form-continue-button"
    >
      {t("actions.continue")}
    </Button>
  )
}

// ─── Form Sub-Component ──────────────────────────────────────

interface FormProps {
  children?: ReactNode
}

function Form({ children }: FormProps) {
  const direction = useDocumentDirection()
  const ctx = useVariantCreateContext()
  const { form, tab, setTab, tabState, handleSubmit, inventoryTabEnabled } =
    ctx

  const hasCustomChildren = Children.count(children) > 0

  return (
    <RouteFocusModal.Form
      form={form}
      data-testid="product-variant-create-form"
    >
      <ProgressTabs
        dir={direction}
        value={tab}
        onValueChange={(tab) => setTab(tab as VariantCreateTab)}
        className="flex h-full flex-col overflow-hidden"
      >
        <KeyboundForm
          onSubmit={handleSubmit}
          className="flex h-full flex-col overflow-hidden"
        >
          <RouteFocusModal.Header data-testid="product-variant-create-form-header">
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="-my-2 w-full max-w-[600px] border-l">
                <ProgressTabs.List
                  className="grid w-full grid-cols-3"
                  data-testid="product-variant-create-form-tabs-list"
                >
                  <ProgressTabs.Trigger
                    status={tabState.detail}
                    value={VariantCreateTab.DETAIL}
                    data-testid="product-variant-create-form-tab-details"
                  >
                    {ctx.product ? "Details" : "Details"}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    status={tabState.price}
                    value={VariantCreateTab.PRICE}
                    data-testid="product-variant-create-form-tab-pricing"
                  >
                    Prices
                  </ProgressTabs.Trigger>
                  {!!inventoryTabEnabled && (
                    <ProgressTabs.Trigger
                      status={tabState.inventory}
                      value={VariantCreateTab.INVENTORY}
                      data-testid="product-variant-create-form-tab-inventory"
                    >
                      Inventory
                    </ProgressTabs.Trigger>
                  )}
                </ProgressTabs.List>
              </div>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body
            className="size-full overflow-hidden"
            data-testid="product-variant-create-form-body"
          >
            {hasCustomChildren ? (
              children
            ) : (
              <>
                <ProgressTabs.Content
                  className="size-full overflow-y-auto"
                  value={VariantCreateTab.DETAIL}
                  data-testid="product-variant-create-form-tab-details-content"
                >
                  <VariantDetailsTab />
                </ProgressTabs.Content>
                <ProgressTabs.Content
                  className="size-full overflow-y-auto"
                  value={VariantCreateTab.PRICE}
                  data-testid="product-variant-create-form-tab-pricing-content"
                >
                  <VariantPricingTab />
                </ProgressTabs.Content>
                {!!inventoryTabEnabled && (
                  <ProgressTabs.Content
                    className="size-full overflow-hidden"
                    value={VariantCreateTab.INVENTORY}
                    data-testid="product-variant-create-form-tab-inventory-content"
                  >
                    <VariantInventoryTab />
                  </ProgressTabs.Content>
                )}
              </>
            )}
          </RouteFocusModal.Body>
          <Footer />
        </KeyboundForm>
      </ProgressTabs>
    </RouteFocusModal.Form>
  )
}

// ─── Root Component ──────────────────────────────────────────

export interface VariantCreateModalProps {
  children?: ReactNode
}

function VariantCreateModalRoot({ children }: VariantCreateModalProps) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  if (isLoading || !product) {
    return <RouteFocusModal />
  }

  return (
    <RouteFocusModal>
      <VariantCreateFormWrapper product={product}>
        {children}
      </VariantCreateFormWrapper>
    </RouteFocusModal>
  )
}

// Internal wrapper for form state + context
function VariantCreateFormWrapper({
  product,
  children,
}: {
  product: HttpTypes.AdminProduct
  children?: ReactNode
}) {
  const { handleSuccess } = useRouteModal()
  const [tab, setTab] = useState<VariantCreateTab>(VariantCreateTab.DETAIL)
  const [tabState, setTabState] = useState<VariantCreateTabState>({
    [VariantCreateTab.DETAIL]: "in-progress",
    [VariantCreateTab.PRICE]: "not-started",
    [VariantCreateTab.INVENTORY]: "not-started",
  })

  const form = useForm<z.infer<typeof CreateProductVariantSchema>>({
    defaultValues: {
      sku: "",
      title: "",
      manage_inventory: false,
      allow_backorder: false,
      inventory_kit: false,
      options: {},
    },
    resolver: zodResolver(CreateProductVariantSchema),
  })

  const { mutateAsync, isPending } = useCreateProductVariant(product.id)
  const { regions } = useRegions({ limit: 9999 })

  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {}
    }
    return regions.reduce(
      (acc, reg) => {
        acc[reg.id] = reg.currency_code
        return acc
      },
      {} as Record<string, string>
    )
  }, [regions])

  const isManageInventoryEnabled = useWatch({
    control: form.control,
    name: "manage_inventory",
  })

  const isInventoryKitEnabled = useWatch({
    control: form.control,
    name: "inventory_kit",
  })

  const inventoryField = useFieldArray({
    control: form.control,
    name: `inventory`,
  })

  const inventoryTabEnabled = !!(
    isManageInventoryEnabled && isInventoryKitEnabled
  )

  const tabOrder: VariantCreateTab[] = useMemo(() => {
    if (inventoryTabEnabled) {
      return [
        VariantCreateTab.DETAIL,
        VariantCreateTab.PRICE,
        VariantCreateTab.INVENTORY,
      ]
    }
    return [VariantCreateTab.DETAIL, VariantCreateTab.PRICE]
  }, [inventoryTabEnabled])

  useEffect(() => {
    if (isInventoryKitEnabled && inventoryField.fields.length === 0) {
      inventoryField.append({
        inventory_item_id: "",
        required_quantity: undefined,
      })
    }
  }, [isInventoryKitEnabled])

  const handleChangeTab = (update: VariantCreateTab) => {
    if (tab === update) {
      return
    }

    if (tabOrder.indexOf(update) < tabOrder.indexOf(tab)) {
      setTabState((prev) => ({
        ...prev,
        [tab]: "not-started",
        [update]: "in-progress",
      }))
      setTab(update)
      return
    }

    const tabs = tabOrder.slice(0, tabOrder.indexOf(update))

    for (const t of tabs) {
      if (t === VariantCreateTab.DETAIL) {
        if (
          !partialFormValidation<z.infer<typeof CreateProductVariantSchema>>(
            form,
            CreateVariantDetailsFields,
            CreateVariantDetailsSchema
          )
        ) {
          setTabState((prev) => ({ ...prev, [t]: "in-progress" }))
          setTab(t)
          return
        }
        setTabState((prev) => ({ ...prev, [t]: "completed" }))
      } else if (t === VariantCreateTab.PRICE) {
        if (
          !partialFormValidation<z.infer<typeof CreateProductVariantSchema>>(
            form,
            CreateVariantPriceFields,
            CreateVariantPriceSchema
          )
        ) {
          setTabState((prev) => ({ ...prev, [t]: "in-progress" }))
          setTab(t)
          return
        }
        setTabState((prev) => ({ ...prev, [t]: "completed" }))
      }
    }

    setTabState((prev) => ({
      ...prev,
      [tab]: "completed",
      [update]: "in-progress",
    }))
    setTab(update)
  }

  const handleNextTab = (currentTab: VariantCreateTab) => {
    if (tabOrder.indexOf(currentTab) + 1 >= tabOrder.length) {
      return
    }
    const nextTab = tabOrder[tabOrder.indexOf(currentTab) + 1]
    handleChangeTab(nextTab)
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    const { allow_backorder, manage_inventory, sku, title } = data

    await mutateAsync(
      {
        title,
        sku: sku || undefined,
        allow_backorder,
        manage_inventory,
        options: data.options,
        prices: Object.entries(data.prices ?? {})
          .map(([currencyOrRegion, value]) => {
            if (value === "" || value === undefined) {
              return undefined
            }

            const ret = {} as AdminCreateProductVariantPrice
            const amount = castNumber(value)

            if (currencyOrRegion.startsWith("reg_")) {
              ret.rules = { region_id: currencyOrRegion }
              ret.currency_code = regionsCurrencyMap[currencyOrRegion]
            } else {
              ret.currency_code = currencyOrRegion
            }

            ret.amount = amount

            return ret
          })
          .filter(Boolean),
        inventory_items: (data.inventory || [])
          .map((i) => {
            if (!i.required_quantity || !i.inventory_item_id) {
              return false
            }

            return {
              ...i,
              required_quantity: castNumber(i.required_quantity),
            }
          })
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          handleSuccess()
        },
        onError: (error) => {
          import("@medusajs/ui").then(({ toast }) =>
            toast.error(error.message)
          )
        },
      }
    )
  })

  const contextValue: VariantCreateContextValue = {
    product,
    form,
    tab,
    setTab: handleChangeTab,
    tabState,
    handleNextTab,
    handleSubmit,
    isPending,
    inventoryTabEnabled,
  }

  const hasCustomChildren = Children.count(children) > 0

  return (
    <VariantCreateProvider value={contextValue}>
      {hasCustomChildren ? children : <Form />}
    </VariantCreateProvider>
  )
}

// Compound component export
export const VariantCreateModal = Object.assign(VariantCreateModalRoot, {
  Form,
  DetailsTab: VariantDetailsTab,
  PricingTab: VariantPricingTab,
  InventoryTab: VariantInventoryTab,
  Footer,
  useContext: useVariantCreateContext,
})
