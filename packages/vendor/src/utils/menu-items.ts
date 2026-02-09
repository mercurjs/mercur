import type { MenuItem } from "@mercurjs/dashboard-sdk"

const settingsRouteRegex = /^\/settings\//

export const getMenuItemExtensions = (
  menuItems: MenuItem[],
  type: "settings" | "main"
) => {
  return menuItems.filter((item) => {
    if (item.nested) {
      return false
    }

    if (type === "settings") {
      return settingsRouteRegex.test(item.path)
    }

    return !settingsRouteRegex.test(item.path)
  })
}

export const getNestedMenuItems = (
  menuItems: MenuItem[],
  parentPath: string
) => {
  return menuItems
    .filter((item) => item.nested === parentPath)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
}
