import type { Meta, StoryObj } from "@storybook/react"

import { Hero } from "./Hero"

const meta: Meta<typeof Hero> = {
  component: Hero,
  decorators: (Story) => <Story />,
}

export default meta
type Story = StoryObj<typeof Hero>

export const FirstStory: Story = {
  args: {
    heading: "Snag your style in a flash",
    paragraph: "Buy, sell, and discover pre-loved from the trendiest brands.",
    image: "/images/hero/Image.jpg",
    buttons: [
      { label: "Buy now", path: "#" },
      { label: "Sell now", path: "3" },
    ],
  },
}
