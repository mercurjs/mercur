import { HttpTypes } from "@medusajs/types"
import { MercurFeatureFlags } from "@mercurjs/types"
import { Button, toast } from "@medusajs/ui"
import { ReactNode, useCallback, useEffect, useMemo, Children } from "react"
import { useForm, useWatch, DeepPartial } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { RouteFocusModal, useRouteModal } from "@components/modals"
import { TabbedForm } from "@components/tabbed-form/tabbed-form"
import { TabDefinition } from "@components/tabbed-form/types"
import { useCreateProduct, useFeatureFlags, useRegions } from "@hooks/api"
import { uploadFilesQuery } from "@lib/client"

import { PRODUCT_CREATE_FORM_DEFAULTS, ProductCreateSchema } from "../../constants"
import { ProductCreateSchemaType } from "../../types"
import {
  generateVariantsFromAttributes,
  normalizeProductFormValues,
} from "../../utils"
import { ProductCreateAttributesForm } from "../product-create-attributes-form"
import { ProductCreateDetailsForm } from "../product-create-details-form"
import { ProductCreateInventoryKitForm } from "../product-create-inventory-kit-form"
import { ProductCreateOrganizeForm } from "../product-create-organize-form"
import { ProductCreateVariantsForm } from "../product-create-variants-form"

const SAVE_DRAFT_BUTTON = "save-draft-button"

type ProductCreateFormProps = {
  children?: ReactNode
  schema?: z.ZodType<ProductCreateSchemaType>
  defaultValues?: DeepPartial<ProductCreateSchemaType>
}

type UploadedFile = { id?: string; url: string }

export const ProductCreateForm = ({
  children,
  schema,
  defaultValues: extraDefaults,
}: ProductCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const form = useForm<ProductCreateSchemaType>({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      ...extraDefaults,
    } as ProductCreateSchemaType,
    resolver: zodResolver(schema ?? ProductCreateSchema),
  })

  const { mutateAsync, isPending } = useCreateProduct()

  const { feature_flags } = useFeatureFlags()
  const productRequestEnabled =
    !!feature_flags?.[MercurFeatureFlags.PRODUCT_REQUEST]

  const {
    regions,
    isPending: isRegionsPending,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions({ limit: 9999 })

  if (isRegionsError) {
    throw regionsError
  }

  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {}
    }

    return regions.reduce(
      (acc: Record<string, string>, reg: any) => {
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

  const watchedAttributes = useWatch({
    control: form.control,
    name: "attributes",
  })

  // Generate variants from variant-axis attributes
  useEffect(() => {
    const currentVariants = form.getValues("variants") ?? []
    const newVariants = generateVariantsFromAttributes(
      watchedAttributes ?? [],
      currentVariants
    )

    if (
      JSON.stringify(newVariants.map((v) => v.attribute_values)) !==
      JSON.stringify(currentVariants.map((v) => v.attribute_values))
    ) {
      form.setValue("variants", newVariants)
    }
  }, [watchedAttributes])

  const handleSubmit = form.handleSubmit(async (values, e) => {
    if (isRegionsPending) {
      return
    }

    let isDraftSubmission = false
    if (e?.nativeEvent instanceof SubmitEvent) {
      const submitter = e?.nativeEvent?.submitter as HTMLButtonElement
      isDraftSubmission = submitter?.dataset?.name === SAVE_DRAFT_BUTTON
    }

    const media = values.media || []
    const payload = { ...values, media: undefined }

    let uploadedMedia: (UploadedFile & { isThumbnail: boolean })[] = []
    try {
      const filesToUpload = media
        .map((m, i) => ({ file: m.file, isThumbnail: m.isThumbnail, index: i }))
        .filter((m) => !!m.file)

      if (filesToUpload.length) {
        const result = await uploadFilesQuery(
          filesToUpload.map(({ file }) => ({ file }))
        )
        const uploadedFiles: UploadedFile[] = result?.files ?? []
        uploadedMedia = uploadedFiles.map((file, i) => ({
          ...file,
          isThumbnail: filesToUpload[i].isThumbnail,
        }))
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }

    const submittedStatus = isDraftSubmission
      ? "draft"
      : productRequestEnabled
        ? "proposed"
        : "published"

    await mutateAsync(
      normalizeProductFormValues({
        ...payload,
        media: uploadedMedia,
        status: submittedStatus as any,
        regionsCurrencyMap,
      }) as any,
      {
        onSuccess: (data: any) => {
          if (submittedStatus === "proposed") {
            toast.success(t("products.create.requestSuccessToast"))
          } else {
            toast.success(
              t("products.create.successToast", {
                title: data.product.title,
              })
            )
          }

          handleSuccess(`../${data.product.id}`)
        },
        onError: (error: any) => {
          toast.error(error.message)
        },
      }
    )
  })

  const transformTabs = useCallback(
    (tabs: TabDefinition<ProductCreateSchemaType>[]) => {
      const showInventoryTab =
        watchedVariants?.some((v) => v.manage_inventory && v.inventory_kit) ??
        false

      return tabs.map((tab) => {
        if (tab.id === "inventory") {
          return {
            ...tab,
            isVisible: () => showInventoryTab,
          }
        }
        return tab
      })
    },
    [watchedVariants]
  )

  const defaultTabs = useMemo(
    () => [
      <ProductCreateDetailsForm key="details" />,
      <ProductCreateOrganizeForm key="organize" />,
      <ProductCreateAttributesForm key="attributes" />,
      <ProductCreateVariantsForm key="variants" />,
      <ProductCreateInventoryKitForm key="inventory" />,
    ],
    []
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending || isRegionsPending}
      transformTabs={transformTabs}
      footer={({ isLastTab, onNext, isLoading }) => (
        <div
          className="flex items-center justify-end gap-x-2"
          data-testid="product-create-form-footer-actions"
        >
          <RouteFocusModal.Close asChild>
            <Button
              variant="secondary"
              size="small"
              data-testid="product-create-form-cancel-button"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            data-name={SAVE_DRAFT_BUTTON}
            size="small"
            type="submit"
            isLoading={isLoading}
            className="whitespace-nowrap"
            data-testid="product-create-form-save-draft-button"
          >
            {t("actions.saveAsDraft")}
          </Button>
          {isLastTab ? (
            <Button
              data-name="publish-button"
              key="submit-button"
              type="submit"
              variant="primary"
              size="small"
              isLoading={isLoading}
              data-testid="product-create-form-publish-button"
            >
              {t("actions.publish")}
            </Button>
          ) : (
            <Button
              key="next-button"
              type="button"
              variant="primary"
              size="small"
              onClick={() => onNext()}
              data-testid="product-create-form-continue-button"
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
