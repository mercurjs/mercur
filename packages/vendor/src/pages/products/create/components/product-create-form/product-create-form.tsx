import {
  buildScopedAdditionalData,
  refineAdditionalData,
  useExtension,
} from "@mercurjs/dashboard-shared"
import { MercurFeatureFlags } from "@mercurjs/types"
import { Button, toast } from "@medusajs/ui"
import { ReactNode, useCallback, useEffect, useMemo, Children } from "react"
import { useForm, DeepPartial } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"

import { RouteFocusModal, useRouteModal } from "@components/modals"
import { TabbedForm } from "@components/tabbed-form/tabbed-form"
import { TabDefinition } from "@components/tabbed-form/types"
import { useCreateProduct, useFeatureFlags } from "@hooks/api"
import { sdk } from "@lib/client"

import {
  PRODUCT_CREATE_FIELD_IDS,
  PRODUCT_CREATE_FORM_DEFAULTS,
  PRODUCT_CREATE_VARIANT_COLUMN_IDS,
  ProductCreateSchema,
} from "../../constants"
import { ProductCreateSchemaType } from "../../types"
import {
  normalizeProductFormValues,
  seedVariantAdditionalData,
  subscribeVariantsToAttributes,
} from "../../utils"
import { ProductCreateAttributesForm } from "../product-create-attributes-form"
import { ProductCreateDetailsForm } from "../product-create-details-form"
import { ProductCreateOrganizeForm } from "../product-create-organize-form"
import { ProductCreateVariantsForm } from "../product-create-variants-form"

type ProductCreateFormProps = {
  children?: ReactNode
  schema?: typeof ProductCreateSchema
  defaultValues?: DeepPartial<ProductCreateSchemaType>
}

type UploadedFile = { id?: string; url: string }

// The variants tab is a data grid: its fields are per-variant columns.
const FORM_TABS = ["details", "organize", "attributes"]
const VARIANTS_TAB = "variants"

export const ProductCreateForm = ({
  children,
  schema,
  defaultValues: extraDefaults,
}: ProductCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const extension = useExtension()

  const productAdditionalData = useMemo(
    () =>
      buildScopedAdditionalData(extension, {
        model: "product",
        zone: "create",
        tabs: FORM_TABS,
        builtInFieldIds: PRODUCT_CREATE_FIELD_IDS,
      }),
    [extension]
  )
  const variantAdditionalData = useMemo(
    () =>
      buildScopedAdditionalData(extension, {
        model: "product",
        zone: "create",
        tabs: [VARIANTS_TAB],
        exactTab: true,
        builtInFieldIds: PRODUCT_CREATE_VARIANT_COLUMN_IDS,
      }),
    [extension]
  )

  const resolverSchema = useMemo(
    () =>
      refineAdditionalData(schema ?? ProductCreateSchema, {
        additionalData: productAdditionalData.schema,
        rows: {
          path: "variants",
          schema: variantAdditionalData.schema,
          include: (row) => row.should_create === true,
        },
      }),
    [schema, productAdditionalData, variantAdditionalData]
  )

  const form = useForm<ProductCreateSchemaType>({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      additional_data: productAdditionalData.defaults,
      ...extraDefaults,
      variants: seedVariantAdditionalData(
        (extraDefaults?.variants ??
          PRODUCT_CREATE_FORM_DEFAULTS.variants ??
          []) as ProductCreateSchemaType["variants"],
        variantAdditionalData.defaults
      ),
    } as ProductCreateSchemaType,
    resolver: zodResolver(resolverSchema),
  })

  const { mutateAsync, isPending } = useCreateProduct()

  const { feature_flags } = useFeatureFlags()
  const productRequestEnabled =
    !!feature_flags?.[MercurFeatureFlags.PRODUCT_REQUEST]

  useEffect(
    () => subscribeVariantsToAttributes(form, variantAdditionalData.defaults),
    [form, variantAdditionalData]
  )

  // Continue validates a tab's own fields, so each tab also checks the custom
  // fields it renders (untabbed ones render on the first tab).
  const transformTabs = useCallback(
    (tabs: TabDefinition<ProductCreateSchemaType>[]) =>
      tabs.map((tab, index) => {
        if (!tab.validationFields || !FORM_TABS.includes(tab.id)) return tab
        const custom = extension
          .getFormFields(
            "product",
            "create",
            tab.id,
            PRODUCT_CREATE_FIELD_IDS,
            index > 0
          )
          .map(
            ({ name }) =>
              `additional_data.${name}` as `additional_data.${string}`
          )
        return custom.length
          ? { ...tab, validationFields: [...tab.validationFields, ...custom] }
          : tab
      }),
    [extension]
  )

  const submitProduct = async (
    values: ProductCreateSchemaType,
    isDraftSubmission: boolean
  ) => {
    const media = values.media || []
    const payload = { ...values, media: undefined }

    let uploadedMedia: (UploadedFile & { isThumbnail: boolean })[] = []
    try {
      const filesToUpload = media
        .map((m, i) => ({ file: m.file, isThumbnail: m.isThumbnail, index: i }))
        .filter((m) => !!m.file)

      if (filesToUpload.length) {
        const result = await sdk.vendor.uploads.mutate({
          files: filesToUpload.map(({ file }) => file),
        })
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

    try {
      const data = await mutateAsync(
        normalizeProductFormValues({
          ...payload,
          media: uploadedMedia,
          status: submittedStatus as any,
        }) as any
      )

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
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    await submitProduct(values, false)
  })

  const handleSaveAsDraft = async () => {
    // Drafts only require a title; bypass the full schema so users can save
    // incomplete products without filling category, attributes, etc.
    const titleValid = await form.trigger("title")
    if (!titleValid) {
      return
    }
    await submitProduct(form.getValues(), true)
  }

  const defaultTabs = useMemo(
    () => [
      <ProductCreateDetailsForm key="details" />,
      <ProductCreateOrganizeForm key="organize" />,
      <ProductCreateAttributesForm key="attributes" />,
      <ProductCreateVariantsForm key="variants" />,
    ],
    []
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      model="product"
      zone="create"
      form={form}
      transformTabs={transformTabs}
      onSubmit={handleSubmit}
      isLoading={isPending}
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
            variant="secondary"
            size="small"
            type="button"
            onClick={handleSaveAsDraft}
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
