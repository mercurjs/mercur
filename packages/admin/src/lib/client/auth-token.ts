import { adminAuth, adminTokenStore, resolveAuthHeaders } from '@mercurjs/client'

export const getAuthToken = () => adminTokenStore.get()
export const setAuthToken = (token: string) => adminTokenStore.set(token)
export const clearAuthToken = () => adminTokenStore.clear()

export const getAuthHeaders = () => resolveAuthHeaders(adminAuth())
