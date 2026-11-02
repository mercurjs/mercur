import {
  resolveAuthHeaders,
  vendorAuth,
  vendorSellerStore,
  vendorTokenStore,
} from '@mercurjs/client'

export const getAuthToken = () => vendorTokenStore.get()
export const setAuthToken = (token: string) => vendorTokenStore.set(token)
export const clearAuthToken = () => vendorTokenStore.clear()

export const getSellerId = () => vendorSellerStore.get()
export const setSellerId = (sellerId: string) => vendorSellerStore.set(sellerId)
export const clearSellerId = () => vendorSellerStore.clear()

export const getAuthHeaders = () => resolveAuthHeaders(vendorAuth())
