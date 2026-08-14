"use client";

import { useEffect } from "react";

import { useTheme } from "@/components/providers/Theme/use-theme";

export function NativeRuntime() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    let detachBackButton: (() => void) | undefined;

    const setup = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");

        if (cancelled || !Capacitor.isNativePlatform()) {
          return;
        }

        const [{ App }, { SplashScreen }] = await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/splash-screen"),
        ]);

        await SplashScreen.hide();

        const handle = await App.addListener(
          "backButton",
          ({ canGoBack }) => {
            if (canGoBack) {
              window.history.back();
              return;
            }

            void App.exitApp();
          }
        );

        detachBackButton = () => {
          void handle.remove();
        };
      } catch {
        // Website / desktop shells do not ship the native bridge.
      }
    };

    void setup();

    return () => {
      cancelled = true;
      detachBackButton?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncStatusBar = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");

        if (cancelled || !Capacitor.isNativePlatform()) {
          return;
        }

        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({
          style: resolvedTheme === "dark" ? Style.Light : Style.Dark,
        });
      } catch {
        // Website / desktop shells do not ship the native bridge.
      }
    };

    void syncStatusBar();

    return () => {
      cancelled = true;
    };
  }, [resolvedTheme]);

  return null;
}
