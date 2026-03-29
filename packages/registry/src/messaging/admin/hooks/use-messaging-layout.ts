import { useLayoutEffect } from "react"

/**
 * Override the shell's scroll behavior to give the messaging
 * pages a full-height, non-scrolling layout. Restores original
 * styles on unmount.
 */
export function useMessagingLayout() {
  useLayoutEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null
    const contentCol = main?.parentElement as HTMLElement | null
    const gutter = main?.firstElementChild as HTMLElement | null

    const origMain = main?.style.cssText ?? ""
    const origCol = contentCol?.style.cssText ?? ""
    const origGutter = gutter?.style.cssText ?? ""

    if (contentCol) contentCol.style.overflow = "hidden"
    if (main) {
      main.style.overflow = "hidden"
      main.style.minHeight = "0"
    }
    if (gutter) {
      gutter.style.flex = "1"
      gutter.style.minHeight = "0"
      gutter.style.overflow = "hidden"
    }

    return () => {
      if (main) main.style.cssText = origMain
      if (contentCol) contentCol.style.cssText = origCol
      if (gutter) gutter.style.cssText = origGutter
    }
  }, [])
}
