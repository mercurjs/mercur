import { customRoutes } from "virtual:mercur/routes";
import widgets from "virtual:mercur/widgets";
import navigation from "virtual:mercur/navigation";
import customFields from "virtual:mercur/custom-fields";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider } from "@tanstack/react-query";
import { ExtensionProvider } from "@mercurjs/dashboard-shared";
import { ThemeProvider } from "./providers";
import { I18nProvider, Toaster, TooltipProvider } from "@medusajs/ui";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { I18n } from "./components/utilities/i18n";
import { getRouteMap } from "./get-route-map";
import { createRouteMap, getRoutesByType } from "./utils/routes";
import { useMemo } from "react";
import { queryClient } from "./lib/query-client";

export default function App() {
  const routes = useMemo(() => {
    return {
      settingsRoutes: createRouteMap(getRoutesByType(customRoutes, "settings")),
      mainRoutes: createRouteMap(getRoutesByType(customRoutes, "main")),
      publicRoutes: createRouteMap(getRoutesByType(customRoutes, "public")),
    };
  }, []);

  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ExtensionProvider
              widgets={widgets}
              navigation={navigation}
              customFields={customFields}
            >
              <I18n />
              <I18nProvider>
                <RouterProvider
                  router={createBrowserRouter(getRouteMap(routes), {
                    basename: __BASE__,
                  })}
                />
              </I18nProvider>
              <Toaster />
            </ExtensionProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  );
}
