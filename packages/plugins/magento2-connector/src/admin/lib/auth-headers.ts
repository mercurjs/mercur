// Importing getAuthHeaders from @mercurjs/admin would be a cycle: the dashboard
// loads plugin extensions while its own module is still initialising.
const AUTH_TOKEN_KEY = "mercur_admin_auth_token"

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  return token ? { Authorization: `Bearer ${token}` } : {}
}
