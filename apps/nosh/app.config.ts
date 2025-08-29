import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(__dirname, ".env") })

const MEDUSA_BASE_URL = process.env.MEDUSA_BASE_URL || "http://localhost:9004"
const MEDUSA_PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || ""

export default {
  expo: {
    name: "nosh",
    slug: "nosh",
    version: "1.0.0",
    orientation: "portrait",
    icon: "src/assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "nosh",
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.perhats.nosh',
    },
    android: {
      package: 'com.perhats.nosh',
      adaptiveIcon: {
        foregroundImage: "src/assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "src/assets/images/favicon.png",
    },
    plugins: [
      "expo-asset",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "src/assets/images/splash-icon.png",
        },
      ],
    ],
    extra: {
      MEDUSA_BASE_URL,
      MEDUSA_PUBLISHABLE_KEY,
    },
  },
}


