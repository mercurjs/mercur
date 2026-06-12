import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, ThumbnailBadge } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { MercurFeatureFlags } from "@mercurjs/types"
import { Button, Checkbox, clx, CommandBar, toast, Tooltip } from "@medusajs/ui"
import { Fragment, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { RouteFocusModal, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useFeatureFlags } from "@hooks/api"
import { useUpdateProductVariant } from "@hooks/api/products"

type ProductImage = {
  id: string
  url: string
  variants?: Array<{ id: string }> | null
}

type VariantWithMedia = HttpTypes.AdminProductVariant & {
  thumbnail?: string | null
  product?: { images?: ProductImage[] | null } | null
}

const MediaSchema = z.object({
  image_ids: z.array(z.string()),
  thumbnail: z.string().nullable(),
})

type MediaSchemaType = z.infer<typeof MediaSchema>

/**
 * Selection-only variant media editor (mirrors Medusa admin).
 *
 * Variant images are product images linked through the product↔variant
 * junction. The vendor picks which of the product's images belong to
 * this variant; new files are uploaded on the product media page, not
 * here. On submit we diff the selection into `add`/`remove` image ids and
 * hand them to the variant update, which stages a `VARIANT_UPDATE` change
 * that links/unlinks the junction on apply.
 */
export const EditVariantMediaForm = ({
  variant,
}: {
  variant: VariantWithMedia
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { feature_flags } = useFeatureFlags()
  const isProductRequestEnabled =
    !!feature_flags?.[MercurFeatureFlags.PRODUCT_REQUEST]

  const allProductImages = variant.product?.images ?? []
  const variantImageIds = allProductImages
    .filter((image) => (image.variants ?? []).some((v) => v.id === variant.id))
    .map((image) => image.id)

  const [selection, setSelection] = useState<Record<string, true>>({})

  const form = useForm<MediaSchemaType>({
    defaultValues: {
      image_ids: variantImageIds,
      thumbnail: variant.thumbnail ?? null,
    },
    resolver: zodResolver(MediaSchema),
  })

  const formImageIds = form.watch("image_ids")
  const formThumbnail = form.watch("thumbnail")

  const availableImages = allProductImages.filter(
    (image) => !formImageIds.includes(image.id)
  )

  const { mutateAsync, isPending } = useUpdateProductVariant(
    variant.product_id!,
    variant.id
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    const add = data.image_ids.filter((id) => !variantImageIds.includes(id))
    const remove = variantImageIds.filter((id) => !data.image_ids.includes(id))

    // Drop a thumbnail that no longer points at one of the variant's images.
    const selectedUrls = new Set(
      allProductImages
        .filter((image) => data.image_ids.includes(image.id))
        .map((image) => image.url)
    )
    const thumbnail =
      data.thumbnail && selectedUrls.has(data.thumbnail) ? data.thumbnail : null

    await mutateAsync(
      {
        images: { add, remove },
        thumbnail,
      },
      {
        onSuccess: () => {
          toast.success(
            isProductRequestEnabled
              ? t("products.edit.requestSuccessToast")
              : t("products.media.successToast")
          )
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const handleAddImageToVariant = (imageId: string) => {
    form.setValue("image_ids", [...form.getValues("image_ids"), imageId], {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const handleCheckedChange = useCallback(
    (id: string) => {
      return (val: boolean) => {
        if (!val) {
          const { [id]: _, ...rest } = selection
          setSelection(rest)
        } else {
          setSelection((prev) => ({ ...prev, [id]: true }))
        }
      }
    },
    [selection]
  )

  const handlePromoteToThumbnail = () => {
    const ids = Object.keys(selection)
    if (!ids.length) {
      return
    }

    const selectedImage = allProductImages.find((image) => image.id === ids[0])
    if (selectedImage) {
      form.setValue("thumbnail", selectedImage.url, {
        shouldDirty: true,
        shouldTouch: true,
      })
    }
    setSelection({})
  }

  const handleRemoveSelectedImages = () => {
    const selectedIds = Object.keys(selection)
    if (!selectedIds.length) {
      return
    }

    form.setValue(
      "image_ids",
      form.getValues("image_ids").filter((id) => !selectedIds.includes(id)),
      { shouldDirty: true, shouldTouch: true }
    )
    setSelection({})
  }

  const selectionCount = Object.keys(selection).length
  const isSelectedImageThumbnail =
    selectionCount === 1 &&
    allProductImages.find((image) => image.id === Object.keys(selection)[0])
      ?.url === formThumbnail

  return (
    <RouteFocusModal.Form blockSearchParams form={form}>
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <div className="relative flex size-full">
            <div className="bg-ui-bg-subtle flex-1 overflow-auto">
              <div className="grid h-fit auto-rows-auto grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6 lg:p-6">
                {allProductImages
                  .filter((image) => formImageIds.includes(image.id))
                  .map((image) => (
                    <MediaGridItem
                      key={image.id}
                      media={image}
                      checked={!!selection[image.id]}
                      onCheckedChange={handleCheckedChange(image.id)}
                      isThumbnail={image.url === formThumbnail}
                    />
                  ))}
              </div>
            </div>

            <div className="border-ui-border-base bg-ui-bg-base hidden w-80 border-l lg:block">
              <div className="border-ui-border-base flex flex-col gap-y-1 border-b px-4 py-4">
                <span className="text-ui-fg-base txt-compact-small-plus">
                  {t("products.media.availableImages")}
                </span>
                <span className="text-ui-fg-muted txt-small">
                  {t("products.media.selectToAdd")}
                </span>
              </div>
              <div className="overflow-auto">
                {availableImages.length ? (
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {availableImages.map((image) => (
                      <UnassociatedImageItem
                        key={image.id}
                        media={image}
                        onAdd={() => handleAddImageToVariant(image.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-ui-fg-muted txt-small px-4 py-6">
                    {t("products.media.emptyState.description")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <CommandBar open={!!selectionCount}>
          <CommandBar.Bar>
            <CommandBar.Value>
              {t("general.countSelected", { count: selectionCount })}
            </CommandBar.Value>
            <CommandBar.Seperator />
            {selectionCount === 1 && !isSelectedImageThumbnail && (
              <Fragment>
                <CommandBar.Command
                  action={handlePromoteToThumbnail}
                  label={t("products.media.makeThumbnail")}
                  shortcut="t"
                />
                <CommandBar.Seperator />
              </Fragment>
            )}
            <CommandBar.Command
              action={handleRemoveSelectedImages}
              label={t("products.media.removeSelected")}
              shortcut="r"
            />
          </CommandBar.Bar>
        </CommandBar>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

interface MediaView {
  id: string
  url: string
}

const MediaGridItem = ({
  media,
  checked,
  onCheckedChange,
  isThumbnail,
}: {
  media: MediaView
  checked: boolean
  onCheckedChange: (value: boolean) => void
  isThumbnail: boolean
}) => {
  const { t } = useTranslation()

  return (
    <div className="shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus bg-ui-bg-subtle-hover group relative aspect-square h-auto max-w-full overflow-hidden rounded-lg outline-none">
      {isThumbnail && (
        <div className="absolute left-2 top-2">
          <Tooltip content={t("products.media.thumbnailTooltip")}>
            <ThumbnailBadge />
          </Tooltip>
        </div>
      )}
      <div
        className={clx("transition-fg absolute right-2 top-2 opacity-0", {
          "group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100":
            !checked,
          "opacity-100": checked,
        })}
      >
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
      </div>
      <img
        src={media.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </div>
  )
}

const UnassociatedImageItem = ({
  media,
  onAdd,
}: {
  media: MediaView
  onAdd: () => void
}) => {
  return (
    <button
      type="button"
      className="shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus bg-ui-bg-subtle-hover group relative aspect-square h-auto max-w-full cursor-pointer overflow-hidden rounded-lg outline-none"
      onClick={onAdd}
    >
      <div className="transition-fg absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100">
        <div className="bg-ui-bg-base border-ui-border-base shadow-elevation-card-rest flex h-12 w-12 items-center justify-center rounded-full border">
          <Plus />
        </div>
      </div>
      <img
        src={media.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </button>
  )
}
