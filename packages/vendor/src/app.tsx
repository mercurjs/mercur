import { customRoutes } from "virtual:mercur/routes";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider } from "@tanstack/react-query";
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
  }, [customRoutes]);

  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <I18n />
            <I18nProvider>
              <RouterProvider
                router={createBrowserRouter(getRouteMap(routes))}
              />
            </I18nProvider>
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  );
}
