import { useEffect, useRef } from "react"

import { useSidebar } from "./use-sidebar"

/**
 * Collapses the desktop sidebar to its icon rail for as long as the calling
 * component is mounted, restoring whatever the user had open before. Intended
 * for dense, full-height surfaces — the inbox, the editor — that need the
 * horizontal space but should not permanently change the user's preference.
 */
export const useCollapsedSidebar = (collapsed = true) => {
  const { desktop, setDesktop } = useSidebar()

  const desktopRef = useRef(desktop)
  desktopRef.current = desktop

  useEffect(() => {
    if (!collapsed) {
      return
    }

    const previous = desktopRef.current
    setDesktop(false)

    return () => setDesktop(previous)
  }, [collapsed, setDesktop])
}
