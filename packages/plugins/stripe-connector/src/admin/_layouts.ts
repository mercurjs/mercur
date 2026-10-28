import { defineLayoutPreferences } from "@mercurjs/dashboard-sdk"

export default defineLayoutPreferences({
  "nav.main": {
    groups: [{ id: "integrations", label: "Integrations", rank: 5 }],
  },
})
