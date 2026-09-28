import { useSidebar } from "./use-sidebar"

export const useSidebarMenuPlacement = (align: "start" | "end") => {
  const { state } = useSidebar()

  return state === "collapsed" ? { side: "right" as const, align } : {}
}
