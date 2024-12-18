import { Redirect, Route, Switch } from 'wouter'
import { ProtectedRoute } from './protected-route'
import { RegisterPageAsync } from '@/pages/register'
import { LoginPageAsync } from '@/pages/login'
import { PropsWithChildren, Suspense } from 'react'
import { AppSidebarAsync } from '@/widgets/app-sidebar'
import { OrdersPageAsync } from '@/pages/orders'

export const AppRouter = () => {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/register">
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterPageAsync />
        </Suspense>
      </Route>
      <Route path="/login">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginPageAsync />
        </Suspense>
      </Route>

      {/* Protected dashboard routes */}
      <ProtectedRoute path="/dashboard" nest>
        <Shell>
          <Switch>
            <Route path="/orders">
              <Suspense fallback={<div>Loading...</div>}>
                <OrdersPageAsync />
              </Suspense>
            </Route>
            <Route>404, Not Found!</Route>
          </Switch>
        </Shell>
      </ProtectedRoute>

      {/* Root redirect */}
      <Route path="/">
        <Redirect to="/dashboard/orders" />
      </Route>

      {/* Fallback 404 */}
      <Route>404, Not Found!</Route>
    </Switch>
  )
}

const Shell = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-screen items-start overflow-hidden w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <AppSidebarAsync />
      </Suspense>
      <div className="flex w-full max-w-[1600px] flex-col gap-y-2 p-10">
        {children}
      </div>
    </div>
  )
}
