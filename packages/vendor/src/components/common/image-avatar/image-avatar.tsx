import { clx } from "@medusajs/ui"
import imagesConverter from "../../../utils/images-conventer"

export default function ImageAvatar({
  src,
  size = 6,
  rounded = false,
}: {
  src: string
  size?: number
  rounded?: boolean
}) {
  const formattedSrc = imagesConverter(src)

  return (
    <img
      src={formattedSrc}
      alt="avatar"
      className={clx(
        `w-${size} h-${size} border rounded-md`,
        rounded && "rounded-full"
      )}
    />
  )
}
