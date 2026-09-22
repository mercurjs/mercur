import { Dispatch, SetStateAction, createContext } from "react"

export type SidebarState = "expanded" | "collapsed"

export type SidebarContextValue = {
  /**
   * `collapsed` renders the desktop sidebar as an icon rail rather than
   * hiding it. Mirrors the `data-state` attribute the layout styles read.
   */
  state: SidebarState
  desktop: boolean
  mobile: boolean
  toggle: (view: "desktop" | "mobile") => void
  setDesktop: Dispatch<SetStateAction<boolean>>
  setMobile: Dispatch<SetStateAction<boolean>>
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)
