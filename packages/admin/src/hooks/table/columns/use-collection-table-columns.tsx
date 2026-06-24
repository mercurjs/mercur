import { HttpTypes } from "@medusajs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Thumbnail } from "../../../components/common/thumbnail"
import { TextCell } from "../../../components/table/table-cells/common/text-cell"
import {
  CollectionWithImages,
  getCollectionGallery,
} from "../../../pages/collections/common/components/collection-image-fields"

const columnHelper = createColumnHelper<HttpTypes.AdminCollection>()

export const useCollectionTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("fields.title"),
        cell: ({ getValue, row }) => {
          const gallery = getCollectionGallery(
            (row.original as CollectionWithImages).media_images
          )
          const thumbnailSrc =
            gallery.find((image) => image.is_thumbnail)?.url ??
            gallery[0]?.url ??
            null

          return (
            <div className="flex size-full items-center gap-x-3 overflow-hidden">
              <Thumbnail src={thumbnailSrc} />
              <span className="truncate">{getValue()}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("handle", {
        header: t("fields.handle"),
        cell: ({ getValue }) => <TextCell text={`/${getValue()}`} />,
      }),
      columnHelper.accessor("products", {
        header: t("fields.products"),
        cell: ({ getValue }) => {
          const count = getValue()?.length || undefined

          return <TextCell text={count} />
        },
      }),
    ],
    [t]
  )
}
