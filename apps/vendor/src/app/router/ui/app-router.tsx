import { Redirect, Route, Switch } from 'wouter'
import { ProtectedRoute } from './protected-route'
import { RegisterPageAsync } from '@/pages/register'
import { LoginPageAsync } from '@/pages/login'
import { Suspense } from 'react'

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
        <Switch>
          <Route path="/orders">
            <Orders />
            <Route path="/:id" component={OrderDetails} />
          </Route>
          <Route>404, Not Found!</Route>
        </Switch>
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

const Orders = () => {
  return <div>Orders</div>
}

const OrderDetails = () => {
  return <div>OrderDetails</div>
}
