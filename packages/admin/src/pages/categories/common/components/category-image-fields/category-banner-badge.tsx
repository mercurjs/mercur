import { ListBullet } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

/**
 * Badge marking a gallery image as the category banner.
 *
 * `@medusajs/icons` has no blue "banner" badge (its only bar badge,
 * `MinusBadge`, is red), so per docs/UI-ICONS.md we compose the design's
 * badge from the `ListBullet` icon inside a blue token-styled badge that
 * mirrors `ThumbnailBadge` (the thumbnail marker).
 */
export const CategoryBannerBadge = ({
  className,
}: {
  className?: string
}) => {
  return (
    <span
      className={clx(
        "bg-ui-tag-blue-icon flex size-4 items-center justify-center rounded-[4px]",
        className
      )}
      data-testid="category-banner-badge"
    >
      <ListBullet className="text-ui-fg-on-color" width={11} height={11} />
    </span>
  )
}
