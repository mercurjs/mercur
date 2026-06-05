import { Fragment, useCallback, useEffect, useMemo, useState } from "react"

import { ThumbnailBadge } from "@medusajs/icons"
import { Checkbox, clx, CommandBar, Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

type MediaItem = {
  file?: File
  url?: string
  isThumbnail?: boolean
  id?: string
}

type EditVariantMediaFormProps = {
  variantIndex: number
  variantTitle?: string
  onSaveMedia?: (variantIndex: number, media: MediaItem[]) => void
  onClose?: () => void
  saveRef: React.MutableRefObject<(() => void) | null>
  initialMedia?: MediaItem[]
  productMedia: MediaItem[]
}

export const EditVariantMediaForm = ({
  variantIndex,
  onSaveMedia,
  onClose,
  saveRef,
  initialMedia = [],
  productMedia = [],
}: EditVariantMediaFormProps) => {
  const { t } = useTranslation()

  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(
    () => new Set(initialMedia.filter((m) => m.url).map((m) => m.url!))
  )

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    () => {
      const thumb = initialMedia.find((m) => m.isThumbnail)
      return thumb?.url ?? null
    }
  )

  const [checkedUrls, setCheckedUrls] = useState<
    Record<string, true>
  >({})

  const availableMedia = useMemo(
    () =>
      productMedia.filter(
        (m): m is MediaItem & { url: string } => !!m.url
      ),
    [productMedia]
  )

  const selectedImages = useMemo(
    () => availableMedia.filter((m) => selectedUrls.has(m.url)),
    [availableMedia, selectedUrls]
  )

  const unselectedImages = useMemo(
    () => availableMedia.filter((m) => !selectedUrls.has(m.url)),
    [availableMedia, selectedUrls]
  )

  const handleSelectImage = useCallback((url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }, [])

  const handleDeselectImage = useCallback(
    (url: string) => {
      setSelectedUrls((prev) => {
        const next = new Set(prev)
        next.delete(url)
        return next
      })

      if (thumbnailUrl === url) {
        setThumbnailUrl(null)
      }

      const { [url]: _, ...restChecked } = checkedUrls
      setCheckedUrls(restChecked)
    },
    [thumbnailUrl, checkedUrls]
  )

  const handleCheckedChange = useCallback(
    (url: string, value: boolean) => {
      if (!value) {
        const { [url]: _, ...rest } = checkedUrls
        setCheckedUrls(rest)
        return
      }
      setCheckedUrls((prev) => ({ ...prev, [url]: true }))
    },
    [checkedUrls]
  )

  const handlePromoteToThumbnail = useCallback(() => {
    const urls = Object.keys(checkedUrls)
    if (urls.length !== 1) {
      return
    }
    setThumbnailUrl(urls[0])
    setCheckedUrls({})
  }, [checkedUrls])

  const getEffectiveThumbnailUrl = useCallback(() => {
    if (selectedUrls.size === 0) {
      return null
    }
    if (thumbnailUrl && selectedUrls.has(thumbnailUrl)) {
      return thumbnailUrl
    }
    return [...selectedUrls][0]
  }, [selectedUrls, thumbnailUrl])

  const handleSave = useCallback(() => {
    const effectiveThumb = getEffectiveThumbnailUrl()
    const media: MediaItem[] = [...selectedUrls].map((url) => ({
      url,
      isThumbnail: url === effectiveThumb,
    }))
    onSaveMedia?.(variantIndex, media)
    onClose?.()
  }, [
    getEffectiveThumbnailUrl,
    selectedUrls,
    onSaveMedia,
    variantIndex,
    onClose,
  ])

  useEffect(() => {
    saveRef.current = handleSave
  }, [handleSave, saveRef])

  const checkedCount = Object.keys(checkedUrls).length

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <div className="flex size-full">
        <div className="flex-1 overflow-auto bg-ui-bg-subtle p-6">
          <div className="flex flex-wrap content-start gap-6">
            {selectedImages.map((img) => {
              const effectiveThumb = getEffectiveThumbnailUrl()
              const isThumb = img.url === effectiveThumb

              return (
                <SelectedImageCard
                  key={img.url}
                  image={img}
                  isThumbnail={isThumb}
                  checked={!!checkedUrls[img.url]}
                  onCheckedChange={(val) =>
                    handleCheckedChange(img.url, val)
                  }
                />
              )
            })}
          </div>
        </div>
        <div className="w-px shrink-0 bg-ui-border-base" />
        <div className="flex w-[318px] shrink-0 flex-col">
          <div className="p-4">
            <p className="txt-compact-small-plus text-ui-fg-base">
              {t("products.media.selectImages")}
            </p>
            <p className="txt-small mt-1 text-ui-fg-subtle">
              {t("products.media.selectImagesHint")}
            </p>
          </div>
          <div className="h-px bg-ui-border-base" />
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {unselectedImages.map((img) => (
                <UnselectedImageCard
                  key={img.url}
                  image={img}
                  onSelect={() => handleSelectImage(img.url)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <CommandBar open={!!checkedCount}>
        <CommandBar.Bar>
          <CommandBar.Value>
            {t("general.countSelected", {
              count: checkedCount,
            })}
          </CommandBar.Value>
          <CommandBar.Seperator />
          {checkedCount === 1 && (
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
            action={() => {
              Object.keys(checkedUrls).forEach((url) =>
                handleDeselectImage(url)
              )
              setCheckedUrls({})
            }}
            label={t("actions.remove")}
            shortcut="r"
          />
        </CommandBar.Bar>
      </CommandBar>
    </div>
  )
}

type SelectedImageCardProps = {
  image: MediaItem & { url: string }
  isThumbnail: boolean
  checked: boolean
  onCheckedChange: (value: boolean) => void
}

const SelectedImageCard = ({
  image,
  isThumbnail,
  checked,
  onCheckedChange,
}: SelectedImageCardProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={clx(
        "group relative size-[156px] shrink-0 overflow-hidden rounded-lg",
        "shadow-elevation-card-rest"
      )}
    >
      {isThumbnail && (
        <div className="absolute left-2 top-2 z-[1]">
          <Tooltip
            content={t("products.media.thumbnailTooltip")}
          >
            <ThumbnailBadge />
          </Tooltip>
        </div>
      )}
      <div
        className={clx(
          "absolute right-2 top-2 z-[1] opacity-0 transition-opacity",
          "group-hover:opacity-100",
          { "opacity-100": checked }
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={t("actions.select")}
        />
      </div>
      <img
        src={image.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </div>
  )
}

type UnselectedImageCardProps = {
  image: MediaItem & { url: string }
  onSelect: () => void
}

const UnselectedImageCard = ({
  image,
  onSelect,
}: UnselectedImageCardProps) => {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clx(
        "aspect-square w-full overflow-hidden rounded-lg",
        "shadow-elevation-card-rest transition-shadow",
        "hover:shadow-elevation-card-hover",
        "outline-none focus-visible:shadow-borders-focus"
      )}
      aria-label={t("products.media.selectImages")}
    >
      <img
        src={image.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </button>
  )
}
