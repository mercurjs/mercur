export { default } from './app'

// Reusable form components
export { TabbedForm, useTabbedForm, defineTabMeta } from './components/tabbed-form'
export type { TabDefinition } from './components/tabbed-form'
export { Form } from './components/common/form'
export { SwitchBox } from './components/common/switch-box'
export { FileUpload } from './components/common/file-upload'
export type { FileType, FileUploadProps } from './components/common/file-upload'
export { ChipInput } from './components/inputs/chip-input'

// Table components
export { _DataTable as DataTable } from './components/table/data-table'
export type { Filter } from './components/table/data-table'
export { useDataTable } from './hooks/use-data-table'

// Page layout components
export { SingleColumnPage } from './components/layout/pages/single-column-page'
export { ActionMenu } from './components/common/action-menu'

// Product constants
export { PRODUCT_DETAIL_FIELDS, PRODUCT_DETAIL_QUERY } from './pages/products/constants'

// Permissions
export {
  PermissionGuard,
  PermissionsProvider,
  RoutePermissionGuard,
  usePermissions,
  useResourcePermissions,
} from '@mercurjs/dashboard-shared'
export type { PermissionGuardProps } from '@mercurjs/dashboard-shared'
export type {
  Permission,
  PermissionKey,
  PermissionMap,
  PermissionRight,
  RouteHandle,
} from '@mercurjs/dashboard-sdk'

export { getAuthHeaders } from './lib/client/auth-token'
