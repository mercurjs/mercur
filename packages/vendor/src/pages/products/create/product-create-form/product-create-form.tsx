import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { HttpTypes } from "@medusajs/types"
import { Button, ProgressStatus, ProgressTabs, toast } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { RouteFocusModal, useRouteModal } from "@components/modals"
import { TabbedFormContext } from "@components/tabbed-form"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useRegions } from "@hooks/api"
import { useAttributes } from "../../../../hooks/api/attributes"
import { usePricePreferences } from "@hooks/api/price-preferences"
import { useCreateProduct } from "@hooks/api/products"
import { useStockLocations } from "@hooks/api/stock-locations"
import { uploadFilesQuery } from "@lib/client"
import {
  PRODUCT_CREATE_FORM_DEFAULTS,
  ProductCreateSchema,
} from "../constants"
import { ProductCreateSchemaType } from "../types"
import { decorateVariantsWithDefaultValues } from "../utils"
import {
  ProductCreateAttributesForm,
  ProductCreateAttributesFormRef,
} from "../product-create-attributes-form/product-create-attributes-form"
import { ProductCreateDetailsForm } from "../product-create-details-form"
import { ProductCreateInventoryKitForm } from "../product-create-inventory-kit-form"
import { ProductCreateOrganizeForm } from "../product-create-organize-form"
import { ProductCreateVariantsForm } from "../product-create-variants-form"

enum Tab {
  DETAILS = "details",
  ORGANIZE = "organize",
  ATTRIBUTES = "attributes",
  VARIANTS = "variants",
  INVENTORY = "inventory",
}

type TabState = Record<Tab, ProgressStatus>

type MediaItem = {
  file?: File
  url?: string
  isThumbnail?: boolean
  id?: string
}

type UploadedMedia = HttpTypes.AdminFile & {
  isThumbnail: boolean
}

const SAVE_DRAFT_BUTTON = "save-draft-button"
const SEC_CAT_PRODUCT_KEY = "sec_cat_product_key"

const TAB_ORDER: Tab[] = [
  Tab.DETAILS,
  Tab.ORGANIZE,
  Tab.ATTRIBUTES,
  Tab.VARIANTS,
  Tab.INVENTORY,
]

const isMovingForward = (currentTab: Tab, newTab: Tab): boolean => {
  const currentIndex = TAB_ORDER.indexOf(currentTab)
  const newIndex = TAB_ORDER.indexOf(newTab)
  return newIndex > currentIndex
}

type ProductCreateFormProps = {
  defaultChannel?: HttpTypes.AdminSalesChannel
  store?: HttpTypes.AdminStore
  onOpenMediaModal?: (
    variantIndex: number,
    variantTitle?: string,
    initialMedia?: MediaItem[],
    productMedia?: MediaItem[]
  ) => void
  onSaveVariantMediaRef?: React.MutableRefObject<
    ((variantIndex: number, media: MediaItem[]) => void) | null
  >
}

export const ProductCreateForm = ({
  defaultChannel,
  store,
  onOpenMediaModal,
  onSaveVariantMediaRef,
}: ProductCreateFormProps) => {
  const [tab, setTab] = useState<Tab>(Tab.DETAILS)
  const [maxReachedTab, setMaxReachedTab] = useState<Tab>(Tab.DETAILS)
  const [tabState, setTabState] = useState<TabState>({
    [Tab.DETAILS]: "in-progress",
    [Tab.ORGANIZE]: "not-started",
    [Tab.ATTRIBUTES]: "not-started",
    [Tab.VARIANTS]: "not-started",
    [Tab.INVENTORY]: "not-started",
  })

  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { regions } = useRegions({ limit: 9999 })
  const { price_preferences: pricePreferences } = usePricePreferences({
    limit: 9999,
  })

  const { attributes: allAttributes } = useAttributes({
    fields:
      "id,name,handle,description,ui_component,is_required,product_categories.*,possible_values.*",
  })

  const { stock_locations = [] } = useStockLocations({
    limit: 9999,
    fields: "id,name",
  })

  const dynamicAttributeSchema = useMemo(() => {
    const attributeFields: Record<string, z.ZodTypeAny> = {}

    allAttributes?.forEach((attr: any) => {
      switch (attr.ui_component) {
        case "multivalue":
          attributeFields[attr.handle] = z
            .array(z.string())
            .optional()
          attributeFields[`${attr.handle}UseForVariants`] = z
            .boolean()
            .optional()
          break
        case "select":
        case "text":
        case "text_area":
          attributeFields[attr.handle] = z.string().optional()
          break
        case "unit":
          attributeFields[attr.handle] = z
            .union([z.string(), z.number()])
            .optional()
          break
        case "toggle":
          attributeFields[attr.handle] = z.string().optional()
          break
      }
    })

    return attributeFields
  }, [allAttributes])

  const extendedSchema = useMemo(() => {
    const baseSchema = ProductCreateSchema.innerType()
    const extendedBaseSchema = baseSchema.extend({
      ...dynamicAttributeSchema,
    })

    return extendedBaseSchema.superRefine((data, ctx) => {
      if (data.variants.every((v: any) => !v.should_create)) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "invalid_length",
        })
      }

      const skus = new Set<string>()
      data.variants.forEach((v: any, index: any) => {
        if (v.sku) {
          if (skus.has(v.sku)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`variants.${index}.sku`],
              message: "SKU must be unique",
            })
          }
          skus.add(v.sku)
        }
      })
    })
  }, [dynamicAttributeSchema])

  const dynamicDefaultValues = useMemo(() => {
    const defaults: Record<string, any> = {}

    allAttributes?.forEach((attr: any) => {
      switch (attr.ui_component) {
        case "multivalue":
          defaults[attr.handle] = []
          defaults[`${attr.handle}UseForVariants`] = false
          break
        case "select":
        case "text":
        case "unit":
        case "text_area":
        case "toggle":
          defaults[attr.handle] = undefined
          break
      }
    })

    return defaults
  }, [allAttributes])

  const form = useForm({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      ...dynamicDefaultValues,
      sales_channels: defaultChannel
        ? [{ id: defaultChannel.id, name: defaultChannel.name }]
        : [],
    } as any,
    resolver: zodResolver(extendedSchema),
    mode: "onBlur",
  })

  const { mutateAsync, isPending } = useCreateProduct()

  const attributesFormRef =
    useRef<ProductCreateAttributesFormRef>(null)

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  })

  const watchedMedia = useWatch({
    control: form.control,
    name: "media",
  }) as MediaItem[] | undefined

  const showInventoryTab = useMemo(
    () =>
      watchedVariants.some(
        (v: any) => v.manage_inventory && v.inventory_kit
      ),
    [watchedVariants]
  )

  const handleSaveVariantMedia = useCallback(
    (variantIndex: number, media: MediaItem[]) => {
      const currentVariants = form.getValues("variants") || []
      if (currentVariants[variantIndex]) {
        const updatedVariants = [...currentVariants]
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          media,
        }
        form.setValue("variants", updatedVariants, {
          shouldDirty: true,
        })
      }
    },
    [form]
  )

  useEffect(() => {
    if (tab === Tab.VARIANTS) {
      const currentOptions = form.getValues("options")
      const currentVariants = form.getValues("variants")
      if (
        currentOptions.length === 0 &&
        currentVariants.length === 0
      ) {
        form.setValue(
          "variants",
          decorateVariantsWithDefaultValues([
            {
              title: "Default variant",
              should_create: true,
              variant_rank: 0,
              options: {},
              is_default: true,
            },
          ])
        )
      }
    }
  }, [tab])

  useEffect(() => {
    if (onSaveVariantMediaRef) {
      onSaveVariantMediaRef.current = handleSaveVariantMedia
    }
  }, [handleSaveVariantMedia, onSaveVariantMediaRef])

  const handleSubmit = form.handleSubmit(async (values, e) => {
    let isDraftSubmission = false

    if (e?.nativeEvent instanceof SubmitEvent) {
      const submitter = e?.nativeEvent
        ?.submitter as HTMLButtonElement
      isDraftSubmission =
        submitter.dataset.name === SAVE_DRAFT_BUTTON
    }

    const media = values.media || []
    const { secondary_categories, ...rest } = values as any
    const secCatProductKey =
      Array.isArray(secondary_categories) &&
      secondary_categories.length > 0
        ? `sec-cat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        : undefined

    const adminAttributes: Array<{
      attribute_id: string
      values: string[]
      use_for_variations: boolean
    }> = []

    const vendorAttributes: Array<{
      name: string
      values: string[]
      use_for_variations: boolean
      ui_component: string
    }> = []

    const allFieldNames = Object.keys(values)

    let dynamicAttributeFields: string[] = []

    if (allAttributes && allAttributes.length > 0) {
      dynamicAttributeFields = allAttributes.map(
        (attr: any) => attr.handle || attr.id
      )
    }

    const vendorOptions =
      rest.options?.filter(
        (opt: any) =>
          opt.metadata?.author === "vendor" &&
          opt.title &&
          opt.values?.length > 0
      ) || []

    const vendorOptionsForVariants = vendorOptions.filter(
      (opt: any) => opt.useForVariants === true
    )

    const adminOptionsForVariants = (rest.options || []).filter(
      (opt: any) =>
        opt.useForVariants === true &&
        opt.metadata?.author === "admin" &&
        opt.attributeId &&
        opt.title &&
        opt.values?.length > 0
    )

    const requiredAttributeOptions: Array<{
      title: string
      values: string[]
      metadata: Record<string, unknown>
      useForVariants: boolean
    }> = []

    allAttributes?.forEach((attr: any) => {
      if (!attr.is_required) return

      const fieldHandle = attr.handle || attr.id
      const value = form.getValues(fieldHandle as any)
      if (value === undefined || value === null || value === "")
        return

      if (
        attr.ui_component === "multivalue" &&
        Array.isArray(value) &&
        value.length > 0
      ) {
        const useForVariants = form.getValues(
          `${fieldHandle}UseForVariants` as any
        )
        const selectedValues = value
          .map((valueId: string) => {
            const possibleValue = attr.possible_values?.find(
              (pv: any) => pv.id === valueId
            )
            return possibleValue ? possibleValue.value : null
          })
          .filter((item: any): item is string => item !== null)

        if (selectedValues.length > 0 && useForVariants === true) {
          requiredAttributeOptions.push({
            title: attr.name,
            values: selectedValues,
            metadata: { author: "admin" },
            useForVariants: true,
          })
        }
      }
    })

    const allOptions = [
      ...vendorOptionsForVariants,
      ...requiredAttributeOptions,
      ...adminOptionsForVariants,
    ]

    dynamicAttributeFields.forEach((fieldName) => {
      const value = form.getValues(fieldName as any)
      if (value === undefined || value === null || value === "")
        return

      const attribute = allAttributes?.find(
        (attr: any) => (attr.handle || attr.id) === fieldName
      )
      if (!attribute) return

      if (Array.isArray(value) && value.length > 0) {
        const attrFieldHandle = (attribute as any).handle || (attribute as any).id
        const useForVariants = form.getValues(
          `${attrFieldHandle}UseForVariants` as any
        )
        const vals = value
          .map((valueId: string) => {
            const possibleValue = (
              attribute as any
            ).possible_values?.find(
              (pv: any) => pv.id === valueId
            )
            return possibleValue ? possibleValue.value : valueId
          })
          .filter(
            (item: any): item is string =>
              item !== null && item !== undefined
          )

        if (vals.length > 0) {
          adminAttributes.push({
            attribute_id: (attribute as any).id,
            values: vals.map((item: any) => String(item)),
            use_for_variations: useForVariants === true,
          })
        }
      } else if (!Array.isArray(value)) {
        let actualValue = value
        if (
          (attribute as any).possible_values &&
          typeof value === "string"
        ) {
          const possibleValue = (
            attribute as any
          ).possible_values.find(
            (pv: any) => pv.id === value
          )
          if (possibleValue) {
            actualValue = possibleValue.value
          }
        }

        adminAttributes.push({
          attribute_id: (attribute as any).id,
          values: [String(actualValue)],
          use_for_variations: false,
        })
      }
    })

    vendorOptions.forEach((option: any) => {
      vendorAttributes.push({
        name: option.title,
        values: option.values.map((value: any) => String(value)),
        use_for_variations: option.useForVariants === true,
        ui_component: "multivalue",
      })
    })

    const allFormOptions: any[] = rest.options || []

    allFormOptions
      .filter(
        (opt: any) =>
          opt.useForVariants === false &&
          opt.metadata?.author === "admin" &&
          opt.attributeId &&
          opt.title &&
          opt.values?.length > 0
      )
      .forEach((option: any) => {
        adminAttributes.push({
          attribute_id: option.attributeId,
          values: option.values.map((value: any) =>
            String(value)
          ),
          use_for_variations: false,
        })
      })

    adminOptionsForVariants.forEach((option: any) => {
      adminAttributes.push({
        attribute_id: option.attributeId,
        values: option.values.map((value: any) => String(value)),
        use_for_variations: true,
      })
    })

    const { ...payload } = rest
    dynamicAttributeFields.forEach((fieldName) => {
      delete payload[fieldName as keyof typeof payload]
    })
    const useForVariantsFields = allFieldNames.filter((fieldName) =>
      fieldName.endsWith("UseForVariants")
    )
    useForVariantsFields.forEach((fieldName) => {
      delete payload[fieldName as keyof typeof payload]
    })

    const finalPayload = { ...payload, media: undefined }

    let uploadedMedia: UploadedMedia[] = []
    try {
      if (media.length) {
        const thumbnailReq = media.filter(
          (m: MediaItem) => m.isThumbnail && m.file
        )
        const otherMediaReq = media.filter(
          (m: MediaItem) => !m.isThumbnail && m.file
        )

        const fileReqs: Array<Promise<UploadedMedia[]>> = []
        if (thumbnailReq?.length) {
          fileReqs.push(
            uploadFilesQuery(thumbnailReq).then(
              (r: { files?: HttpTypes.AdminFile[] }) =>
                (Array.isArray(r?.files) ? r.files : []).map(
                  (f: HttpTypes.AdminFile) => ({
                    ...f,
                    isThumbnail: true,
                  })
                )
            )
          )
        }
        if (otherMediaReq?.length) {
          fileReqs.push(
            uploadFilesQuery(otherMediaReq).then(
              (r: { files?: HttpTypes.AdminFile[] }) =>
                (Array.isArray(r?.files) ? r.files : []).map(
                  (f: HttpTypes.AdminFile) => ({
                    ...f,
                    isThumbnail: false,
                  })
                )
            )
          )
        }

        uploadedMedia = (await Promise.all(fileReqs)).flat()
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }

    const blobToUploadedUrl = new Map<string, string>()
    const allOriginalMedia = media as MediaItem[]

    if (uploadedMedia.length > 0) {
      const thumbnailItems = allOriginalMedia.filter(
        (m: MediaItem) => m.isThumbnail && m.file
      )
      const otherItems = allOriginalMedia.filter(
        (m: MediaItem) => !m.isThumbnail && m.file
      )

      let thumbIdx = 0
      let otherIdx = 0

      for (const uploaded of uploadedMedia) {
        if (
          uploaded.isThumbnail &&
          thumbIdx < thumbnailItems.length
        ) {
          const blobUrl = thumbnailItems[thumbIdx].url
          if (blobUrl) {
            blobToUploadedUrl.set(blobUrl, uploaded.url)
          }
          thumbIdx++
        }
        if (
          !uploaded.isThumbnail &&
          otherIdx < otherItems.length
        ) {
          const blobUrl = otherItems[otherIdx].url
          if (blobUrl) {
            blobToUploadedUrl.set(blobUrl, uploaded.url)
          }
          otherIdx++
        }
      }
    }

    const variantsToCreate = finalPayload.variants.filter(
      (variant: any) => variant.should_create === true
    )

    const variantImageKeyByIndex = new Map<number, string>()
    const variantsImages: any[] = []

    for (let i = 0; i < variantsToCreate.length; i++) {
      const variant = variantsToCreate[i]
      const variantMedia: MediaItem[] = variant.media || []
      if (!variantMedia.length) continue

      const resolvedUrls = variantMedia
        .map((m: any) =>
          m.url ? blobToUploadedUrl.get(m.url) : undefined
        )
        .filter((url: any): url is string => !!url)

      if (resolvedUrls.length === 0) continue

      const variantThumb = variantMedia.find(
        (m: any) => m.isThumbnail
      )
      const resolvedThumbUrl = variantThumb?.url
        ? blobToUploadedUrl.get(variantThumb.url)
        : undefined
      const thumbnailUrl = resolvedThumbUrl || resolvedUrls[0]

      const variantImageKey = `variant-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      variantImageKeyByIndex.set(i, variantImageKey)
      variantsImages.push({
        variant_image_key: variantImageKey,
        image_urls: resolvedUrls,
        thumbnail_url: thumbnailUrl,
      })
    }

    const mappedVariants = variantsToCreate.map(
      (variant: any, index: number) => {
        const mappedOptions: Record<string, string> = {}

        allOptions.forEach((option: any) => {
          if (variant.options && variant.options[option.title]) {
            mappedOptions[option.title] =
              variant.options[option.title]
          } else {
            const variantTitle = variant.title || ""
            const optionValues = option.values || []
            const matchingValue = optionValues.find(
              (value: string) => variantTitle.includes(value)
            )
            if (matchingValue) {
              mappedOptions[option.title] = matchingValue
            } else if (optionValues.length > 0) {
              mappedOptions[option.title] = optionValues[0]
            }
          }
        })

        const variantImageKey = variantImageKeyByIndex.get(index)
        const {
          media: _media,
          stock_locations: _sl,
          ...variantWithoutMedia
        } = variant

        return {
          ...variantWithoutMedia,
          options:
            Object.keys(mappedOptions).length > 0
              ? mappedOptions
              : {
                  [t("products.create.defaults.optionTitle")]: t(
                    "products.create.defaults.optionValue"
                  ),
                },
          ...(variantImageKey && {
            metadata: { variant_image_key: variantImageKey },
          }),
        }
      }
    )

    const payloadToSend = {
      ...finalPayload,
      status: isDraftSubmission ? "draft" : "proposed",
      images: uploadedMedia,
      weight:
        parseInt((finalPayload as any).weight || "") || undefined,
      length:
        parseInt((finalPayload as any).length || "") || undefined,
      height:
        parseInt((finalPayload as any).height || "") || undefined,
      width:
        parseInt((finalPayload as any).width || "") || undefined,
      type_id: (finalPayload as any).type_id || undefined,
      tags:
        (finalPayload as any).tags?.map((tag: any) => ({
          id: tag,
        })) || [],
      collection_id:
        (finalPayload as any).collection_id || undefined,
      shipping_profile_id: undefined,
      enable_variants: undefined,
      options:
        allOptions.length > 0
          ? allOptions
          : [
              {
                title: t("products.create.defaults.optionTitle"),
                values: [t("products.create.defaults.optionValue")],
              },
            ],
      metadata: (() => {
        const existing = (finalPayload as any)?.metadata ?? undefined
        if (!secCatProductKey) return existing
        return {
          ...(existing ?? {}),
          [SEC_CAT_PRODUCT_KEY]: secCatProductKey,
        }
      })(),
      additional_data: (() => {
        const additionalData: Record<string, any> = {}
        if (adminAttributes.length > 0) {
          additionalData.admin_attributes = adminAttributes
        }
        if (vendorAttributes.length > 0) {
          additionalData.vendor_attributes = vendorAttributes
        }
        if (
          Array.isArray(secondary_categories) &&
          secondary_categories.length > 0 &&
          secCatProductKey
        ) {
          additionalData.secondary_categories = [
            {
              sec_cat_product_key: secCatProductKey,
              category_ids: secondary_categories,
            },
          ]
        }
        if (variantsImages.length > 0) {
          additionalData.variants_images = variantsImages
        }
        return Object.keys(additionalData).length > 0
          ? additionalData
          : undefined
      })(),
      categories: finalPayload.categories.map((cat: any) => ({
        id: cat,
      })),
      variants: mappedVariants.map((variant: any) => {
        const {
          media: _m,
          stock_locations: _sl,
          ...variantWithoutMedia
        } = variant
        return {
          ...variantWithoutMedia,
          sku:
            variant.sku === "" ? undefined : variant.sku,
          manage_inventory: true,
          allow_backorder: false,
          should_create: undefined,
          is_default: undefined,
          inventory_kit: undefined,
          inventory: undefined,
          prices: Object.keys(variant.prices || {}).map(
            (key: string) => ({
              currency_code: key,
              amount: parseFloat(variant.prices?.[key] as string),
            })
          ),
        }
      }),
    }

    const productData = await mutateAsync(payloadToSend as any, {
      onError: (error) => {
        toast.error(error.message)
      },
    })

    toast.success(t("products.create.successToast", { title: (productData as any).product.title }))
    handleSuccess(`../${(productData as any).product.id}`)
  })

  const onNext = async (currentTab: Tab) => {
    let fieldsToValidate: (keyof ProductCreateSchemaType)[] = []
    let shouldProceed = true

    switch (currentTab) {
      case Tab.DETAILS:
        fieldsToValidate = ["title", "handle"]
        break
      case Tab.ORGANIZE:
        fieldsToValidate = ["categories"]
        break
      case Tab.ATTRIBUTES:
        if (attributesFormRef.current) {
          shouldProceed =
            await attributesFormRef.current.validateAttributes()
        }
        break
      case Tab.VARIANTS:
        fieldsToValidate = ["variants", "options"]
        break
      case Tab.INVENTORY:
        break
    }

    if (fieldsToValidate.length > 0) {
      const valid = await form.trigger(fieldsToValidate)
      if (!valid) return
    }

    if (!shouldProceed) return

    let nextTab: Tab
    if (currentTab === Tab.DETAILS) {
      nextTab = Tab.ORGANIZE
    } else if (currentTab === Tab.ORGANIZE) {
      nextTab = Tab.ATTRIBUTES
    } else if (currentTab === Tab.ATTRIBUTES) {
      nextTab = Tab.VARIANTS
    } else if (currentTab === Tab.VARIANTS) {
      nextTab = Tab.INVENTORY
    } else {
      return
    }

    const currentTabIndex = TAB_ORDER.indexOf(currentTab)
    const currentMaxIndex = TAB_ORDER.indexOf(maxReachedTab)
    if (currentTabIndex >= currentMaxIndex) {
      setMaxReachedTab(TAB_ORDER[currentMaxIndex + 1])
    }

    setTab(nextTab)
  }

  useEffect(() => {
    const currentIndex = TAB_ORDER.indexOf(tab)
    const maxReachedIndex = TAB_ORDER.indexOf(maxReachedTab)

    const currentState: TabState = {
      [Tab.DETAILS]: "not-started",
      [Tab.ORGANIZE]: "not-started",
      [Tab.ATTRIBUTES]: "not-started",
      [Tab.VARIANTS]: "not-started",
      [Tab.INVENTORY]: "not-started",
    }

    TAB_ORDER.forEach((tabItem, index) => {
      if (index < currentIndex && index <= maxReachedIndex) {
        currentState[tabItem] = "completed"
      } else if (index === currentIndex) {
        currentState[tabItem] = "in-progress"
      } else if (
        index > currentIndex &&
        index <= maxReachedIndex
      ) {
        currentState[tabItem] = "completed"
      } else {
        currentState[tabItem] = "not-started"
      }
    })

    setTabState(currentState)
  }, [tab, maxReachedTab])

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
                if (tab !== Tab.VARIANTS) {
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
            value={tab}
            onValueChange={async (newTab) => {
              const newTabValue = newTab as Tab
              const currentIndex = TAB_ORDER.indexOf(tab)
              const newIndex = TAB_ORDER.indexOf(newTabValue)
              const maxReachedIndex =
                TAB_ORDER.indexOf(maxReachedTab)

              const movingForward = isMovingForward(
                tab,
                newTabValue
              )

              if (movingForward) {
                if (newIndex > maxReachedIndex + 1) return

                let fieldsToValidate: (keyof ProductCreateSchemaType)[] =
                  []

                switch (tab) {
                  case Tab.DETAILS:
                    fieldsToValidate = ["title", "handle"]
                    break
                  case Tab.ORGANIZE:
                    fieldsToValidate = ["categories"]
                    break
                  case Tab.ATTRIBUTES:
                    fieldsToValidate = []
                    break
                  case Tab.VARIANTS:
                    fieldsToValidate = ["variants", "options"]
                    break
                  case Tab.INVENTORY:
                    break
                }

                if (fieldsToValidate.length > 0) {
                  const valid =
                    await form.trigger(fieldsToValidate)
                  if (!valid) return
                } else if (tab === Tab.ATTRIBUTES) {
                  if (attributesFormRef.current) {
                    const valid =
                      await attributesFormRef.current.validateAttributes()
                    if (!valid) return
                  }
                }

                if (currentIndex >= maxReachedIndex) {
                  setMaxReachedTab(
                    TAB_ORDER[currentIndex + 1]
                  )
                }
              }

              setTab(newTabValue)
            }}
            className="flex h-full flex-col overflow-hidden"
          >
            <RouteFocusModal.Header>
              <div className="-my-2 w-full border-l">
                <ProgressTabs.List className="justify-start-start flex w-full items-center">
                  <ProgressTabs.Trigger
                    status={tabState[Tab.DETAILS]}
                    value={Tab.DETAILS}
                    className="max-w-[200px] truncate"
                  >
                    {t("products.create.tabs.details")}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    status={tabState[Tab.ORGANIZE]}
                    value={Tab.ORGANIZE}
                    className="max-w-[200px] truncate"
                  >
                    {t("products.create.tabs.organize")}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    status={tabState[Tab.ATTRIBUTES]}
                    value={Tab.ATTRIBUTES}
                    className="max-w-[200px] truncate"
                  >
                    {t("products.create.tabs.attributes")}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    status={tabState[Tab.VARIANTS]}
                    value={Tab.VARIANTS}
                    className="max-w-[200px] truncate"
                  >
                    {t("products.create.tabs.variants")}
                  </ProgressTabs.Trigger>
                  {showInventoryTab && (
                    <ProgressTabs.Trigger
                      status={tabState[Tab.INVENTORY]}
                      value={Tab.INVENTORY}
                      className="max-w-[200px] truncate"
                    >
                      {t("products.create.tabs.inventory")}
                    </ProgressTabs.Trigger>
                  )}
                </ProgressTabs.List>
              </div>
            </RouteFocusModal.Header>
            <RouteFocusModal.Body className="size-full overflow-hidden">
              <ProgressTabs.Content
                className="size-full overflow-y-auto"
                value={Tab.DETAILS}
              >
                <ProductCreateDetailsForm form={form as any} />
              </ProgressTabs.Content>
              <ProgressTabs.Content
                className="size-full overflow-y-auto"
                value={Tab.ORGANIZE}
              >
                <ProductCreateOrganizeForm
                  form={form as any}
                />
              </ProgressTabs.Content>
              <ProgressTabs.Content
                className="size-full overflow-y-auto"
                value={Tab.ATTRIBUTES}
              >
                <ProductCreateAttributesForm
                  form={form as any}
                  ref={attributesFormRef}
                />
              </ProgressTabs.Content>
              <ProgressTabs.Content
                className="size-full overflow-y-auto"
                value={Tab.VARIANTS}
              >
                <ProductCreateVariantsForm
                  form={form as any}
                  store={store}
                  regions={regions}
                  pricePreferences={pricePreferences}
                  onOpenMediaModal={onOpenMediaModal}
                  productMedia={watchedMedia || []}
                />
              </ProgressTabs.Content>
              {showInventoryTab && (
                <ProgressTabs.Content
                  className="size-full overflow-y-auto"
                  value={Tab.INVENTORY}
                >
                  <ProductCreateInventoryKitForm
                    form={form as any}
                  />
                </ProgressTabs.Content>
              )}
            </RouteFocusModal.Body>
          </ProgressTabs>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
              <Button
                data-name={SAVE_DRAFT_BUTTON}
                size="small"
                type="submit"
                onClick={() => {
                  if (
                    form.getValues("categories").length ===
                      0 &&
                    form.getValues("title")
                  ) {
                    onNext(Tab.DETAILS)
                    return
                  }
                  handleSubmit()
                }}
                isLoading={isPending}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {t("actions.saveAsDraft")}
              </Button>
              <PrimaryButton
                tab={tab}
                next={onNext}
                isLoading={isPending}
                showInventoryTab={showInventoryTab}
              />
            </div>
          </RouteFocusModal.Footer>
        </KeyboundForm>
      </RouteFocusModal.Form>
    </TabbedFormContext.Provider>
  )
}

type PrimaryButtonProps = {
  tab: Tab
  next: (tab: Tab) => void
  isLoading?: boolean
  showInventoryTab: boolean
}

const PrimaryButton = ({
  tab,
  next,
  isLoading,
  showInventoryTab,
}: PrimaryButtonProps) => {
  const { t } = useTranslation()

  if (
    (tab === Tab.VARIANTS && !showInventoryTab) ||
    (tab === Tab.INVENTORY && showInventoryTab)
  ) {
    return (
      <Button
        data-name="publish-button"
        key="submit-button"
        type="submit"
        variant="primary"
        size="small"
        isLoading={isLoading}
      >
        {t("actions.publish")}
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
    >
      {t("actions.continue")}
    </Button>
  )
}
