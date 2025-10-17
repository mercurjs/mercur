export enum Hosts {
  VENDOR_PANEL = 'VENDOR_PANEL_URL',
  STOREFRONT = 'STOREFRONT_URL',
  BACKEND = 'BACKEND_URL'
}

export const defaultHosts = {
  [Hosts.VENDOR_PANEL]: 'http://localhost:5173',
  [Hosts.STOREFRONT]: 'http://localhost:3000',
  [Hosts.BACKEND]: 'http://localhost:9000'
}

export const hostTypeToResetPasswordPath = {
  [Hosts.VENDOR_PANEL]: '/reset-password',
  [Hosts.STOREFRONT]: '/reset-password',
  [Hosts.BACKEND]: '/app/reset-password'
}

export const actorTypeToHost = {
  ['customer']: Hosts.STOREFRONT,
  ['seller']: Hosts.VENDOR_PANEL,
  ['user']: Hosts.BACKEND
}

export const buildHostAddress = (hostType: Hosts, path?: string) => {
  return new URL(path || '', process.env[hostType] || defaultHosts[hostType])
}

export const buildResetPasswordUrl = (hostType: Hosts, token?: string) => {
  const url = buildHostAddress(hostType, hostTypeToResetPasswordPath[hostType])

  if (token) {
    url.searchParams.set('token', token)
  }

  return url
}

export const buildInviteUrl = (token: string) => {
  const url = buildHostAddress(Hosts.VENDOR_PANEL, '/invite')
  url.searchParams.set('token', token)

  return url
}
