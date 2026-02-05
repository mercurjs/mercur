import customRoutes from "virtual:mercur/routes"
import config from "virtual:mercur/config"
import { HelmetProvider } from "react-helmet-async"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./providers"
import { Toaster, TooltipProvider } from "@medusajs/ui"

// cimport { createBrowserRouter, RouterProvider } from "react-router-dom"

const queryClient = new QueryClient()

export default function App() {
  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            wassup
            {JSON.stringify(config)}
            {/* <RouterProvider router={createBrowserRouter(customRoutes)} /> */}
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  )
}