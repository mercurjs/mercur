import { createAdminApp } from '@mercurjs/core-admin/app'
import routes from 'virtual:mercur-routes'

createAdminApp({
  root: document.getElementById('root')!,
  routes,
})
