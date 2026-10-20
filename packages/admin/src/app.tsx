import { customRoutes } from "virtual:mercur/routes";
import widgets from "virtual:mercur/widgets";
import navigation from "virtual:mercur/navigation";
import customFields from "virtual:mercur/custom-fields";
import gates from "virtual:mercur/gates";
import layouts from "virtual:mercur/layouts";
import preferences from "virtual:mercur/preferences";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider } from "@tanstack/react-query";
import { ExtensionProvider, Gates, resolveRouteOverrides } from "@mercurjs/dashboard-shared";
import { FeatureFlagProvider, ThemeProvider } from "./providers";
import { I18nProvider, Toaster, TooltipProvider } from "@medusajs/ui";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { I18n } from "./components/utilities/i18n";
import { getRouteMap } from "./get-route-map";
import { createRouteMap, getRoutesByType } from "./utils/routes";
import { useMemo } from "react";
import { queryClient } from "./lib/query-client";

export default function App() {
  const routes = useMemo(() => {
    const resolved = resolveRouteOverrides(customRoutes);
    return {
      settingsRoutes: createRouteMap(getRoutesByType(resolved, "settings")),
      mainRoutes: createRouteMap(getRoutesByType(resolved, "main")),
      publicRoutes: createRouteMap(getRoutesByType(resolved, "public")),
    };
  }, []);

  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FeatureFlagProvider>
              <ExtensionProvider
                widgets={widgets}
                navigation={navigation}
                customFields={customFields}
                gates={gates}
                layouts={layouts}
                preferences={preferences}
              >
                <I18n />
                <I18nProvider>
                  <Gates>
                    <RouterProvider
                      router={createBrowserRouter(getRouteMap(routes), {
                        basename: __BASE__,
                      })}
                    />
                  </Gates>
                </I18nProvider>
                <Toaster />
              </ExtensionProvider>
            </FeatureFlagProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  );
}
