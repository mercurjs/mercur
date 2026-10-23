import { defineLayoutPreferences } from "@mercurjs/dashboard-sdk"

export default defineLayoutPreferences({
  "nav.main": {
    groups: [{ id: "finance", label: "Finance", rank: 5 }],
    entries: {
      "nav:/payouts": { section: "finance" },
    },
  },
})
