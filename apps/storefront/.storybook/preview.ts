import type { Preview } from "@storybook/react"

const preview: Preview = {
  initialGlobals: {
    locale: "en",
    locales: {
      en: "English",
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
