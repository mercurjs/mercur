import type { CapacitorConfig } from "@capacitor/cli";

import {
  APP_ID,
  APP_NAME,
  BACKGROUND_COLOR,
  THEME_COLOR,
} from "./src/identity";
import {
  resolveStorefrontUrl,
  type ShellTarget,
} from "./src/resolve-url";

const target = (process.env.CAP_TARGET ?? "ios-simulator") as ShellTarget;

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: APP_NAME,
  webDir: "www",
  server: {
    url: resolveStorefrontUrl(target),
    cleartext: true,
    allowNavigation: ["*"],
  },
  ios: {
    contentInset: "automatic",
    scheme: "Mercur",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: BACKGROUND_COLOR,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: BACKGROUND_COLOR,
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: THEME_COLOR,
    },
  },
};

export default config;
