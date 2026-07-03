import { XMark } from "@medusajs/icons"
import { IconButton, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { FileType, FileUpload } from "@components/common/file-upload"
import { formatFileSize } from "@lib/format-file-size"
import { COLLECTION_IMAGE_FORMATS, CollectionIconItem } from "./types"

type CollectionIconInputProps = {
  value: CollectionIconItem | null
  onChange: (next: CollectionIconItem | null) => void
  hasError?: boolean
}

export const CollectionIconInput = ({
  value,
  onChange,
  hasError,
}: CollectionIconInputProps) => {
  const { t } = useTranslation()

  const handleUploaded = (files: FileType[]) => {
    const file = files[0]
    if (file) {
      onChange({ url: file.url, file: file.file })
    }
  }

  if (value) {
    return (
      <div
        className="bg-ui-bg-component shadow-elevation-card-rest flex items-center justify-between rounded-lg px-3 py-2"
        data-testid="collection-icon-input-item"
      >
        <div className="flex items-center gap-x-3">
          <div className="bg-ui-bg-base flex h-10 w-[30px] items-center justify-center overflow-hidden rounded-md">
            <img
              src={value.url}
              alt=""
              className="size-full object-contain object-center"
            />
          </div>
          <div className="flex flex-col">
            <Text size="small" leading="compact">
              {value.file?.name ?? value.url}
            </Text>
            {value.file && (
              <Text
                size="xsmall"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {formatFileSize(value.file.size)}
              </Text>
            )}
          </div>
        </div>
        <IconButton
          type="button"
          size="small"
          variant="transparent"
          onClick={() => onChange(null)}
          data-testid="collection-icon-input-delete"
        >
          <XMark />
        </IconButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-2" data-testid="collection-icon-input">
      <FileUpload
        label={t("collections.icon.upload.title")}
        hint={t("collections.icon.upload.hint")}
        multiple={false}
        formats={COLLECTION_IMAGE_FORMATS}
        hasError={hasError}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
