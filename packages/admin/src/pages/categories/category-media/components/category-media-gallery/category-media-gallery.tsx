import {
  ArrowDownTray,
  ThumbnailBadge,
  Trash,
  TriangleLeftMini,
  TriangleRightMini,
} from "@medusajs/icons"
import { ListBadge } from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@medusajs/types"
import { Button, IconButton, Text, Tooltip, clx, usePrompt } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"

import { RouteFocusModal } from "../../../../../components/modals"
import { useUpdateProductCategory } from "../../../../../hooks/api/categories"
import {
  CategoryApiImage,
  CategoryWithImages,
  getCategoryGallery,
} from "../../../common/components/category-image-fields"

type CategoryMediaGalleryProps = {
  category: HttpTypes.AdminProductCategory & CategoryWithImages
}

export const CategoryMediaGallery = ({
  category,
}: CategoryMediaGalleryProps) => {
  const { state } = useLocation()
  const [curr, setCurr] = useState<number>(state?.curr || 0)

  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useUpdateProductCategory(category.id)

  const media = getCategoryGallery(category.media_images)

  const next = useCallback(() => {
    if (isPending) {
      return
    }
    setCurr((current) => (current + 1) % media.length)
  }, [media, isPending])

  const prev = useCallback(() => {
    if (isPending) {
      return
    }
    setCurr((current) => (current - 1 + media.length) % media.length)
  }, [media, isPending])

  const goTo = useCallback(
    (index: number) => {
      if (isPending) {
        return
      }
      setCurr(index)
    },
    [isPending]
  )

  const handleDownloadCurrent = () => {
    if (isPending) {
      return
    }
    const a = document.createElement("a")
    a.href = media[curr].url
    a.download = "image"
    a.target = "_blank"
    a.click()
  }

  const handleDeleteCurrent = async () => {
    const current = media[curr]

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("categories.media.deleteWarning"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    const remaining = media
      .filter((image) => image.id !== current.id)
      .map((image) => ({
        url: image.url,
        is_thumbnail: image.is_thumbnail,
        is_banner: image.is_banner,
      }))

    if (curr === media.length - 1) {
      setCurr((index) => Math.max(0, index - 1))
    }

    await mutateAsync({ media: remaining })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        next()
      } else if (e.key === "ArrowLeft") {
        prev()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [next, prev])

  const noMedia = !media.length

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <RouteFocusModal.Header>
        <div className="flex items-center justify-end gap-x-2">
          <IconButton
            size="small"
            type="button"
            onClick={handleDeleteCurrent}
            disabled={noMedia}
          >
            <Trash />
          </IconButton>
          <IconButton
            size="small"
            type="button"
            onClick={handleDownloadCurrent}
            disabled={noMedia}
          >
            <ArrowDownTray />
          </IconButton>
          <Button variant="secondary" size="small" asChild>
            <Link to={{ pathname: ".", search: "view=edit" }}>
              {t("actions.edit")}
            </Link>
          </Button>
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="flex flex-col overflow-hidden">
        <Canvas curr={curr} media={media} />
        <Preview curr={curr} media={media} prev={prev} next={next} goTo={goTo} />
      </RouteFocusModal.Body>
    </div>
  )
}

const Canvas = ({
  media,
  curr,
}: {
  media: CategoryApiImage[]
  curr: number
}) => {
  const { t } = useTranslation()

  if (media.length === 0) {
    return (
      <div className="bg-ui-bg-subtle flex size-full flex-col items-center justify-center gap-y-4 pb-8 pt-6">
        <div className="flex flex-col items-center">
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-subtle"
          >
            {t("categories.media.empty.header")}
          </Text>
          <Text size="small" className="text-ui-fg-muted">
            {t("categories.media.empty.description")}
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild>
          <Link to="?view=edit">{t("categories.media.upload.title")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-ui-bg-subtle relative size-full overflow-hidden">
      <div className="flex size-full items-center justify-center p-6">
        <div className="relative inline-block max-h-full max-w-full">
          <div className="absolute left-2 top-2 flex items-center gap-x-1">
            {media[curr].is_thumbnail && (
              <Tooltip content={t("categories.media.thumbnail")}>
                <ThumbnailBadge />
              </Tooltip>
            )}
            {media[curr].is_banner && (
              <Tooltip content={t("categories.media.banner")}>
                <ListBadge />
              </Tooltip>
            )}
          </div>
          <img
            src={media[curr].url}
            alt=""
            className="object-fit shadow-elevation-card-rest max-h-[calc(100vh-200px)] w-auto rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  )
}

const MAX_VISIBLE_ITEMS = 8

const Preview = ({
  media,
  curr,
  prev,
  next,
  goTo,
}: {
  media: CategoryApiImage[]
  curr: number
  prev: () => void
  next: () => void
  goTo: (index: number) => void
}) => {
  if (!media.length) {
    return null
  }

  const getVisibleItems = (items: CategoryApiImage[], index: number) => {
    if (items.length <= MAX_VISIBLE_ITEMS) {
      return items
    }
    const half = Math.floor(MAX_VISIBLE_ITEMS / 2)
    const start = (index - half + items.length) % items.length
    const end = (start + MAX_VISIBLE_ITEMS) % items.length
    if (end < start) {
      return [...items.slice(start), ...items.slice(0, end)]
    }
    return items.slice(start, end)
  }

  const visibleItems = getVisibleItems(media, curr)

  return (
    <div className="flex shrink-0 items-center justify-center gap-x-2 border-t p-3">
      <IconButton
        size="small"
        variant="transparent"
        className="text-ui-fg-muted"
        type="button"
        onClick={prev}
      >
        <TriangleLeftMini className="rtl:rotate-180" />
      </IconButton>
      <div className="flex items-center gap-x-2">
        {visibleItems.map((item) => {
          const isCurrentImage = item.id === media[curr].id
          const originalIndex = media.findIndex((i) => i.id === item.id)

          return (
            <button
              type="button"
              aria-label="Media file input"
              onClick={() => goTo(originalIndex)}
              className={clx(
                "transition-fg size-7 overflow-hidden rounded-[4px] outline-none",
                {
                  "shadow-borders-focus": isCurrentImage,
                }
              )}
              key={item.id}
            >
              <img src={item.url} alt="" className="size-full object-cover" />
            </button>
          )
        })}
      </div>
      <IconButton
        size="small"
        variant="transparent"
        className="text-ui-fg-muted"
        type="button"
        onClick={next}
      >
        <TriangleRightMini className="rtl:rotate-180" />
      </IconButton>
    </div>
  )
}
