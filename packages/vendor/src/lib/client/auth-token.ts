const AUTH_TOKEN_KEY = 'mercur_vendor_auth_token'

const SELLER_ID_KEY = 'mercur_vendor_seller_id'

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    return
  }
}

export const getAuthToken = () => read(AUTH_TOKEN_KEY)
export const setAuthToken = (token: string) => write(AUTH_TOKEN_KEY, token)
export const clearAuthToken = () => write(AUTH_TOKEN_KEY, null)

export const getSellerId = () => read(SELLER_ID_KEY)
export const setSellerId = (sellerId: string) => write(SELLER_ID_KEY, sellerId)
export const clearSellerId = () => write(SELLER_ID_KEY, null)

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken()

  const sellerId = getSellerId()

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sellerId ? { 'x-seller-id': sellerId } : {}),
  }
}
