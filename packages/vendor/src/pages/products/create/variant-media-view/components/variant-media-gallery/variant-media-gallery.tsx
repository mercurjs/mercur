import { useCallback, useEffect, useState } from "react"

import {
  ThumbnailBadge,
  TriangleLeftMini,
  TriangleRightMini,
} from "@medusajs/icons"
import { Button, clx, IconButton, Text, Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { VariantMediaViewContext } from "../../variant-media-view-context"

type Media = {
  id: string
  url: string
  isThumbnail: boolean
}

type VariantMediaGalleryProps = {
  goToEdit: () => void
  variantMedia?: any[]
}

export const VariantMediaGallery = ({
  goToEdit,
  variantMedia = [],
}: VariantMediaGalleryProps) => {
  const [curr, setCurr] = useState<number>(0)
  const { t } = useTranslation()

  const media: Media[] = (variantMedia || []).map(
    (m: any, idx: number) => ({
      ...m,
      id: m.id || `variant-${idx}-${m.url}`,
    })
  )

  const next = useCallback(() => {
    setCurr((prev) => (prev + 1) % media.length)
  }, [media.length])

  const prev = useCallback(() => {
    setCurr((prev) => (prev - 1 + media.length) % media.length)
  }, [media.length])

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= media.length) return
      setCurr(index)
    },
    [media.length]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [next, prev])

  const noMedia = !media.length

  return (
    <VariantMediaViewContext.Consumer>
      {() => (
        <div className="flex size-full flex-col bg-ui-bg-subtle">
          {noMedia ? (
            <div className="flex size-full flex-col items-center justify-center gap-y-4 bg-ui-bg-subtle pb-8 pt-6">
              <div className="flex flex-col items-center">
                <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
                  {t("products.media.emptyState.header", "No media")}
                </Text>
                <Text size="small" className="text-ui-fg-muted">
                  {t("products.media.emptyState.description", "No images assigned to this variant.")}
                </Text>
              </div>
              <Button size="small" variant="secondary" onClick={goToEdit}>
                {t("products.media.emptyState.action", "Add images")}
              </Button>
            </div>
          ) : (
            <>
              <div className="relative size-full overflow-hidden bg-ui-bg-subtle">
                <div className="flex size-full items-center justify-center p-6">
                  <div className="relative inline-block max-h-full max-w-full">
                    {media[curr]?.isThumbnail && (
                      <div className="absolute left-2 top-2">
                        <Tooltip content={t("products.media.thumbnailTooltip")}>
                          <ThumbnailBadge />
                        </Tooltip>
                      </div>
                    )}
                    <img
                      src={media[curr]?.url}
                      alt=""
                      className="object-fit max-h-[calc(100vh-200px)] w-auto rounded-xl object-contain shadow-elevation-card-rest"
                    />
                  </div>
                </div>
              </div>
              {media.length > 1 && (
                <div className="flex shrink-0 items-center justify-center gap-x-2 border-t p-3">
                  <IconButton size="small" variant="transparent" className="text-ui-fg-muted" type="button" onClick={prev}>
                    <TriangleLeftMini />
                  </IconButton>
                  <div className="flex items-center gap-x-2">
                    {media.slice(0, 8).map((item, _idx) => {
                      const isCurrentImage = item.id === media[curr]?.id
                      const originalIndex = media.findIndex((i) => i.id === item.id)
                      return (
                        <button
                          type="button"
                          onClick={() => goTo(originalIndex)}
                          className={clx("size-7 overflow-hidden rounded-[4px] outline-none transition-fg", {
                            "shadow-borders-focus": isCurrentImage,
                          })}
                          key={item.id}
                        >
                          <img src={item.url} alt="" className="size-full object-cover" />
                        </button>
                      )
                    })}
                  </div>
                  <IconButton size="small" variant="transparent" className="text-ui-fg-muted" type="button" onClick={next}>
                    <TriangleRightMini />
                  </IconButton>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </VariantMediaViewContext.Consumer>
  )
}
