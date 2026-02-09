import type { MenuItem } from "@mercurjs/dashboard-sdk"

const settingsRouteRegex = /^\/settings\//

export const getMenuItemExtensions = (
  menuItems: MenuItem[],
  type: "settings" | "main"
) => {
  return menuItems.filter((item) => {
    if (type === "settings") {
      return settingsRouteRegex.test(item.path)
    }

    return !settingsRouteRegex.test(item.path)
  })
}
