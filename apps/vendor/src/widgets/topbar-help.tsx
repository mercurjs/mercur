import "@mercurjs/vendor/extension-targets"
import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import { Button } from "@medusajs/ui"

export const config = defineWidgetConfig({
  zone: "topbar.before",
})

const TopbarHelp = () => {
  return (
    <Button
      size="small"
      variant="secondary"
      onClick={() => window.open("https://docs.mercurjs.com", "_blank")}
    >
      Help
    </Button>
  )
}

export default TopbarHelp
