import { Redirect, Route, Switch } from 'wouter'
import { ProtectedRoute } from './protected-route'
import { RegisterPageAsync } from '@/pages/register'
import { LoginPageAsync } from '@/pages/login'
import { Suspense } from 'react'
import { OrdersPageAsync } from '@/pages/orders'
import { Shell } from '@/widgets/shell'
import { FallbackLoader } from '@/widgets/fallback-loader'
import { OrderDetailsPageAsync } from '@/pages/order-details'

export const AppRouter = () => {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/register">
        <Suspense fallback={<FallbackLoader />}>
          <RegisterPageAsync />
        </Suspense>
      </Route>
      <Route path="/login">
        <Suspense fallback={<FallbackLoader />}>
          <LoginPageAsync />
        </Suspense>
      </Route>

      {/* Protected dashboard routes */}
      <ProtectedRoute path="/dashboard" nest>
        <Shell>
          <Switch>
            <Route path="/orders" nest>
              <Suspense fallback={<FallbackLoader />}>
                <OrdersPageAsync />
              </Suspense>
              <Route path=":id">
                <Suspense fallback={<FallbackLoader />}>
                  <OrderDetailsPageAsync />
                </Suspense>
              </Route>
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
