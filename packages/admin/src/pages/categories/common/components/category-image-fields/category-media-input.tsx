import { Photo, Trash, XMark } from "@medusajs/icons"
import { Badge, IconButton, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { FileType, FileUpload } from "@components/common/file-upload"
import { formatFileSize } from "@lib/format-file-size"
import { CATEGORY_IMAGE_FORMATS, CategoryMediaItem } from "./types"

type CategoryMediaInputProps = {
  value: CategoryMediaItem[]
  onChange: (next: CategoryMediaItem[]) => void
  hasError?: boolean
}

export const CategoryMediaInput = ({
  value,
  onChange,
  hasError,
}: CategoryMediaInputProps) => {
  const { t } = useTranslation()

  const handleUploaded = (files: FileType[]) => {
    onChange([
      ...value,
      ...files.map((f) => ({
        url: f.url,
        file: f.file,
        is_thumbnail: false,
        is_banner: false,
        field_id: f.id,
      })),
    ])
  }

  // A flag (thumbnail/banner) is exclusive across the gallery: turning it
  // on for one image clears it from every other.
  const toggleRole = (
    index: number,
    role: "is_thumbnail" | "is_banner",
    on: boolean
  ) => {
    onChange(
      value.map((item, i) => ({
        ...item,
        [role]: i === index ? on : on ? false : item[role],
      }))
    )
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-y-2" data-testid="category-media-input">
      <FileUpload
        label={t("categories.media.upload.title")}
        hint={t("categories.media.upload.hint")}
        formats={CATEGORY_IMAGE_FORMATS}
        hasError={hasError}
        onUploaded={handleUploaded}
      />
      {value.length > 0 && (
        <ul className="flex flex-col gap-y-2" data-testid="category-media-input-list">
          {value.map((item, index) => (
            <li
              key={item.field_id ?? `${item.url}-${index}`}
              className="bg-ui-bg-component shadow-elevation-card-rest flex items-center justify-between rounded-lg px-3 py-2"
              data-testid={`category-media-input-item-${index}`}
            >
              <div className="flex items-center gap-x-3">
                <div className="bg-ui-bg-base flex h-10 w-[30px] items-center justify-center overflow-hidden rounded-md">
                  {item.url ? (
                    <img
                      src={item.url}
                      alt=""
                      className="size-full object-cover object-center"
                    />
                  ) : (
                    <Photo className="text-ui-fg-muted" />
                  )}
                </div>
                <div className="flex flex-col">
                  <Text size="small" leading="compact">
                    {item.file?.name ?? item.url}
                  </Text>
                  <div className="flex items-center gap-x-1">
                    {item.is_thumbnail && (
                      <Badge size="2xsmall" color="green">
                        {t("categories.media.thumbnail")}
                      </Badge>
                    )}
                    {item.is_banner && (
                      <Badge size="2xsmall" color="blue">
                        {t("categories.media.banner")}
                      </Badge>
                    )}
                    {item.file && (
                      <Text
                        size="xsmall"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {formatFileSize(item.file.size)}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-x-1">
                <ActionMenu
                  groups={[
                    {
                      actions: [
                        {
                          label: item.is_thumbnail
                            ? t("categories.media.actions.removeThumbnail")
                            : t("categories.media.actions.setThumbnail"),
                          icon: <Photo />,
                          onClick: () =>
                            toggleRole(index, "is_thumbnail", !item.is_thumbnail),
                        },
                        {
                          label: item.is_banner
                            ? t("categories.media.actions.removeBanner")
                            : t("categories.media.actions.setBanner"),
                          icon: <Photo />,
                          onClick: () =>
                            toggleRole(index, "is_banner", !item.is_banner),
                        },
                      ],
                    },
                    {
                      actions: [
                        {
                          label: t("actions.delete"),
                          icon: <Trash />,
                          onClick: () => remove(index),
                        },
                      ],
                    },
                  ]}
                  data-testid={`category-media-input-item-menu-${index}`}
                />
                <IconButton
                  type="button"
                  size="small"
                  variant="transparent"
                  onClick={() => remove(index)}
                  data-testid={`category-media-input-item-delete-${index}`}
                >
                  <XMark />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
