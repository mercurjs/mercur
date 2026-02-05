import customRoutes from "virtual:mercur/routes"
import { HelmetProvider } from "react-helmet-async"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./providers"
import { Toaster, TooltipProvider } from "@medusajs/ui"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

const queryClient = new QueryClient()

function App() {
  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RouterProvider router={createBrowserRouter(customRoutes)} />
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  )
}

export default App