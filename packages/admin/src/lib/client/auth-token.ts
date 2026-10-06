const AUTH_TOKEN_KEY = 'mercur_admin_auth_token'

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

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}
