import { HttpTypes } from "@medusajs/types"
import { toast } from "@medusajs/ui"
import { ReactNode, Children, useEffect, useMemo, useState } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useRouteModal } from "@components/modals"
import { useExtendableForm } from "@/dashboard-app/forms/hooks"
import { useCreateProduct } from "@hooks/api/products"
import { useExtension } from "@providers/extension-provider"
import { sdk } from "@lib/client"

import {
  PRODUCT_CREATE_FORM_DEFAULTS,
  ProductCreateSchema,
} from "./constants"
import { normalizeProductFormValues } from "./utils"
import { SAVE_DRAFT_BUTTON } from "./product-create-footer"
import {
  ProductCreateTab,
  ProductCreateTabState,
  ProductCreateContextValue,
  ProductCreateProvider,
} from "./product-create-context"
import { Form } from "./product-create-form"

export function ProductCreateFormWrapper({
  store,
  regions,
  pricePreferences,
  defaultChannel,
  children,
}: {
  store: HttpTypes.AdminStore
  regions: HttpTypes.AdminRegion[]
  pricePreferences: HttpTypes.AdminPricePreference[]
  defaultChannel: HttpTypes.AdminSalesChannel | undefined
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { getFormConfigs } = useExtension()
  const configs = getFormConfigs("product", "create")

  const [tab, setTab] = useState<ProductCreateTab>(ProductCreateTab.DETAILS)
  const [tabState, setTabState] = useState<ProductCreateTabState>({
    [ProductCreateTab.DETAILS]: "in-progress",
    [ProductCreateTab.ORGANIZE]: "not-started",
    [ProductCreateTab.VARIANTS]: "not-started",
    [ProductCreateTab.INVENTORY]: "not-started",
  })

  const form = useExtendableForm({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      sales_channels: defaultChannel
        ? [{ id: defaultChannel.id, name: defaultChannel.name }]
        : [],
    },
    schema: ProductCreateSchema,
    configs,
  })

  const { mutateAsync, isPending } = useCreateProduct()

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

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  })

  const showInventoryTab = useMemo(
    () => watchedVariants.some((v) => v.manage_inventory && v.inventory_kit),
    [watchedVariants]
  )

  const handleSubmit = form.handleSubmit(async (values, e) => {
    let isDraftSubmission = false
    if (e?.nativeEvent instanceof SubmitEvent) {
      const submitter = e?.nativeEvent?.submitter as HTMLButtonElement
      isDraftSubmission = submitter.dataset.name === SAVE_DRAFT_BUTTON
    }

    const media = values.media || []
    const payload = { ...values, media: undefined }

    let uploadedMedia: (HttpTypes.AdminFile & { isThumbnail: boolean })[] = []
    try {
      if (media.length) {
        const thumbnailReq = media.find((m) => m.isThumbnail)
        const otherMediaReq = media.filter((m) => !m.isThumbnail)

        const fileReqs = []
        if (thumbnailReq) {
          fileReqs.push(
            sdk.admin.upload
              .create({ files: [thumbnailReq.file] })
              .then((r) => r.files.map((f) => ({ ...f, isThumbnail: true })))
          )
        }
        if (otherMediaReq?.length) {
          fileReqs.push(
            sdk.admin.upload
              .create({
                files: otherMediaReq.map((m) => m.file),
              })
              .then((r) => r.files.map((f) => ({ ...f, isThumbnail: false })))
          )
        }

        uploadedMedia = (await Promise.all(fileReqs)).flat()
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }

    await mutateAsync(
      normalizeProductFormValues({
        ...payload,
        media: uploadedMedia,
        status: (isDraftSubmission ? "draft" : "published") as any,
        regionsCurrencyMap,
      }),
      {
        onSuccess: (data) => {
          toast.success(
            t("products.create.successToast", {
              title: data.product.title,
            })
          )
          handleSuccess(`../${data.product.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const onNext = async (currentTab: ProductCreateTab) => {
    const valid = await form.trigger()
    if (!valid) {
      return
    }
    if (currentTab === ProductCreateTab.DETAILS) {
      setTab(ProductCreateTab.ORGANIZE)
    }
    if (currentTab === ProductCreateTab.ORGANIZE) {
      setTab(ProductCreateTab.VARIANTS)
    }
    if (currentTab === ProductCreateTab.VARIANTS) {
      setTab(ProductCreateTab.INVENTORY)
    }
  }

  useEffect(() => {
    const currentState = { ...tabState }
    if (tab === ProductCreateTab.DETAILS) {
      currentState[ProductCreateTab.DETAILS] = "in-progress"
    }
    if (tab === ProductCreateTab.ORGANIZE) {
      currentState[ProductCreateTab.DETAILS] = "completed"
      currentState[ProductCreateTab.ORGANIZE] = "in-progress"
    }
    if (tab === ProductCreateTab.VARIANTS) {
      currentState[ProductCreateTab.DETAILS] = "completed"
      currentState[ProductCreateTab.ORGANIZE] = "completed"
      currentState[ProductCreateTab.VARIANTS] = "in-progress"
    }
    if (tab === ProductCreateTab.INVENTORY) {
      currentState[ProductCreateTab.DETAILS] = "completed"
      currentState[ProductCreateTab.ORGANIZE] = "completed"
      currentState[ProductCreateTab.VARIANTS] = "completed"
      currentState[ProductCreateTab.INVENTORY] = "in-progress"
    }
    setTabState({ ...currentState })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const contextValue: ProductCreateContextValue = {
    store,
    regions,
    pricePreferences,
    defaultChannel,
    form,
    tab,
    setTab,
    tabState,
    onNext,
    handleSubmit,
    isPending,
    showInventoryTab,
  }

  const hasCustomChildren = Children.count(children) > 0

  return (
    <ProductCreateProvider value={contextValue}>
      {hasCustomChildren ? children : <Form />}
    </ProductCreateProvider>
  )
}
