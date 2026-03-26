import { Button, toast } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { Children, ReactNode, useCallback, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { RouteFocusModal, useRouteModal } from "@components/modals"
import { TabbedForm, TabDefinition } from "@components/tabbed-form"
import { useCreateProduct } from "@hooks/api/products"
import { uploadFilesQuery } from "@lib/client"
import {
  PRODUCT_CREATE_FORM_DEFAULTS,
  ProductCreateSchema,
} from "@pages/products/create/constants"
import { ProductCreateDetailsForm } from "../product-create-details-form"
import { ProductCreateInventoryKitForm } from "../product-create-inventory-kit-form"
import { ProductCreateOrganizeForm } from "../product-create-organize-form"
import { ProductCreateVariantsForm } from "../product-create-variants-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductCreateSchemaType } from "../types"
import { z } from "zod"

const SAVE_DRAFT_BUTTON = "save-draft-button"

type ProductCreateFormProps = {
  defaultChannel?: HttpTypes.AdminSalesChannel
  children?: ReactNode
  schema?: z.ZodType<any>
  defaultValues?: Record<string, any>
}

export const ProductCreateForm = ({
  defaultChannel: defaultChannelProp,
  children,
  schema,
  defaultValues: extraDefaults,
}: ProductCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const defaultChannel = defaultChannelProp

  const form = useForm<ProductCreateSchemaType>({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      ...extraDefaults,
      sales_channels: defaultChannel
        ? [
            {
              id: defaultChannel.id,
              name: defaultChannel.name,
            },
          ]
        : [],
    },
    resolver: zodResolver(schema ?? ProductCreateSchema),
  })

  const { mutateAsync, isPending } = useCreateProduct()

  const defaultTabs = useMemo(
    () => [
      <ProductCreateDetailsForm key="details" />,
      <ProductCreateOrganizeForm key="organize" />,
      <ProductCreateVariantsForm key="variants" />,
      <ProductCreateInventoryKitForm key="inventory" />,
    ],
    []
  )

  const hasCustomChildren = Children.count(children) > 0

  /**
   * TODO: Important to revisit this - use variants watch so high in the tree can cause needless rerenders of the entire page
   * which is suboptimal when rerenders are caused by bulk editor changes
   */
  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  })

  const transformTabs = useCallback(
    (tabs: TabDefinition<ProductCreateSchemaType>[]) =>
      tabs.map((tab) => {
        if (tab.id === "inventory" && tab.isVisible) {
          return {
            ...tab,
            isVisible: () =>
              watchedVariants.some(
                (v) => v.manage_inventory && v.inventory_kit
              ),
          }
        }
        return tab
      }),
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

    let uploadedMedia: (HttpTypes.AdminFile & {
      isThumbnail: boolean
    })[] = []
    try {
      if (media.length) {
        const thumbnailReq = media.filter((m) => m.isThumbnail)
        const otherMediaReq = media.filter((m) => !m.isThumbnail)

        const fileReqs = []
        if (thumbnailReq?.length) {
          fileReqs.push(
            uploadFilesQuery(thumbnailReq).then((r: any) =>
              r.files.map((f: any) => ({
                ...f,
                isThumbnail: true,
              }))
            )
          )
        }
        if (otherMediaReq?.length) {
          fileReqs.push(
            uploadFilesQuery(otherMediaReq).then((r: any) =>
              r.files.map((f: any) => ({
                ...f,
                isThumbnail: false,
              }))
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

    await mutateAsync(
      {
        ...payload,
        status: isDraftSubmission ? "draft" : "published",
        images: uploadedMedia,
        weight: parseInt(payload.weight || "") || undefined,
        length: parseInt(payload.length || "") || undefined,
        height: parseInt(payload.height || "") || undefined,
        width: parseInt(payload.width || "") || undefined,
        type_id: payload.type_id || undefined,
        tags:
          payload.tags?.map((tag) => ({
            id: tag,
          })) || [],
        collection_id: payload.collection_id || undefined,
        shipping_profile_id: undefined,
        enable_variants: undefined,
        additional_data: undefined,
        categories: payload.categories.map((cat) => ({
          id: cat,
        })),
        variants: payload.variants.map((variant) => ({
          ...variant,
          sku: variant.sku === "" ? undefined : variant.sku,
          manage_inventory: true,
          allow_backorder: false,
          should_create: undefined,
          is_default: undefined,
          inventory_kit: undefined,
          inventory: undefined,
          prices: Object.keys(variant.prices || {}).map((key) => ({
            currency_code: key,
            amount: parseFloat(variant.prices?.[key] as string),
          })),
        })),
      },
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

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
      transformTabs={transformTabs}
      footer={({ isLastTab, onNext, isLoading }) => (
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
            isLoading={isLoading}
            className="whitespace-nowrap"
          >
            Draft
          </Button>
          {isLastTab ? (
            <Button
              data-name="publish-button"
              key="submit-button"
              type="submit"
              variant="primary"
              size="small"
              isLoading={isLoading}
            >
              Create Product
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
      )}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}
