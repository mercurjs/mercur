import { useState } from "react"

import { PencilSquare, ThumbnailBadge } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Checkbox,
  clx,
  CommandBar,
  Container,
  Heading,
  Text,
  toast,
  Tooltip,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "@components/common/action-menu"
import { useUpdateProductVariant } from "@hooks/api/products"

type VariantImage = {
  id: string
  url: string
  variants?: Array<{ id: string }> | null
}

type VariantWithMedia = HttpTypes.AdminProductVariant & {
  images?: VariantImage[] | null
  thumbnail?: string | null
}

/**
 * `variant.images` also includes product-level (general) images linked
 * to no variant. The variant media section only manages this variant's
 * own images, so keep the ones explicitly linked to it.
 */
const getVariantImages = (variant: VariantWithMedia): VariantImage[] =>
  (variant.images ?? []).filter((image) =>
    (image.variants ?? []).some((v) => v.id === variant.id)
  )

type Media = {
  id: string
  url: string
  isThumbnail: boolean
}

export const VariantMediaSection = ({
  variant,
}: {
  variant: VariantWithMedia
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const [selection, setSelection] = useState<Record<string, boolean>>({})

  const media = getMedia(variant)

  const { mutateAsync } = useUpdateProductVariant(
    variant.product_id!,
    variant.id
  )

  const handleCheckedChange = (id: string) => {
    setSelection((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: true }
    })
  }

  const handleDelete = async () => {
    const ids = Object.keys(selection)
    const includingThumbnail = ids.some(
      (id) => media.find((m) => m.id === id)?.isThumbnail
    )

    const res = await prompt({
      title: t("general.areYouSure"),
      description: includingThumbnail
        ? t("products.media.deleteWarningWithThumbnail", { count: ids.length })
        : t("products.media.deleteWarning", { count: ids.length }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    // Unlink the selected images from the variant (the synthetic
    // thumbnail entry is not a linked image, so it is filtered out).
    const linkedIds = new Set(getVariantImages(variant).map((i) => i.id))
    const remove = ids.filter((id) => linkedIds.has(id))

    await mutateAsync(
      {
        images: { remove },
        thumbnail: includingThumbnail ? "" : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("products.media.successToast"))
          setSelection({})
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.media.label")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "media",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>
      {media.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4 px-6 py-4">
          {media.map((image) => {
            const isSelected = selection[image.id]

            return (
              <div
                className="group shadow-elevation-card-rest hover:shadow-elevation-card-hover transition-fg relative aspect-square size-full cursor-pointer overflow-hidden rounded-[8px]"
                key={image.id}
              >
                <div
                  className={clx(
                    "transition-fg invisible absolute right-2 top-2 opacity-0 group-hover:visible group-hover:opacity-100",
                    {
                      "visible opacity-100": isSelected,
                    }
                  )}
                >
                  <Checkbox
                    checked={selection[image.id] || false}
                    onCheckedChange={() => handleCheckedChange(image.id)}
                  />
                </div>
                {image.isThumbnail && (
                  <div className="absolute left-2 top-2">
                    <Tooltip content={t("fields.thumbnail")}>
                      <ThumbnailBadge />
                    </Tooltip>
                  </div>
                )}
                <Link to="media">
                  <img
                    src={image.url}
                    alt={variant.title ?? ""}
                    className="size-full object-cover"
                  />
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-y-4 pb-8 pt-6">
          <div className="flex flex-col items-center">
            <Text
              size="small"
              leading="compact"
              weight="plus"
              className="text-ui-fg-subtle"
            >
              {t("products.media.emptyState.header")}
            </Text>
            <Text size="small" className="text-ui-fg-muted">
              {t("products.media.emptyState.description")}
            </Text>
          </div>
          <Button size="small" variant="secondary" asChild>
            <Link to="media">{t("products.media.emptyState.action")}</Link>
          </Button>
        </div>
      )}
      <CommandBar open={!!Object.keys(selection).length}>
        <CommandBar.Bar>
          <CommandBar.Value>
            {t("general.countSelected", {
              count: Object.keys(selection).length,
            })}
          </CommandBar.Value>
          <CommandBar.Seperator />
          <CommandBar.Command
            action={handleDelete}
            label={t("actions.delete")}
            shortcut="d"
          />
        </CommandBar.Bar>
      </CommandBar>
    </Container>
  )
}

const getMedia = (variant: VariantWithMedia): Media[] => {
  const { thumbnail } = variant

  const media: Media[] = getVariantImages(variant).map((image) => ({
    id: image.id,
    url: image.url,
    isThumbnail: image.url === thumbnail,
  }))

  if (thumbnail && !media.some((m) => m.url === thumbnail)) {
    media.unshift({
      id: "img_thumbnail",
      url: thumbnail,
      isThumbnail: true,
    })
  }

  return media
}
