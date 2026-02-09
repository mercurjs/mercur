import customRoutes from "virtual:mercur/routes";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./providers";
import { I18nProvider, Toaster, TooltipProvider } from "@medusajs/ui";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { I18n } from "./components/utilities/i18n";
import { getRouteMap } from "./get-route-map";

const queryClient = new QueryClient();

export default function App() {
  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <I18n />
            <I18nProvider>
              <RouterProvider router={createBrowserRouter(getRouteMap())} />
            </I18nProvider>
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  );
}
