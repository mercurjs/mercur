import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"

const TopbarProbe = () => {
  return <span data-testid="topbar-widget-probe">topbar widget</span>
}

export const config = defineWidgetConfig({ zone: "topbar.after" })

export default TopbarProbe
