import customRoutes from "virtual:mercur/routes";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./providers";
import { I18nProvider, Toaster, TooltipProvider } from "@medusajs/ui";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { I18n } from "./components/utilities/i18n";
import { getRouteMap } from "./get-route-map";
import { DashboardExtensionManager } from "./extensions";
import { DashboardExtensionProvider } from "./extensions/dashboard-extension-provider";

const queryClient = new QueryClient();

const extensionManager = new DashboardExtensionManager({
  formModule: { customFields: {} } as any,
  displayModule: { displays: {} } as any,
  menuItemModule: { menuItems: [] },
  widgetModule: { widgets: [] },
});

export default function App() {
  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <DashboardExtensionProvider api={extensionManager.api}>
            <ThemeProvider>
              <I18n />
              <I18nProvider>
                <RouterProvider
                  router={createBrowserRouter(getRouteMap(customRoutes))}
                />
              </I18nProvider>
              <Toaster />
            </ThemeProvider>
          </DashboardExtensionProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  );
}
