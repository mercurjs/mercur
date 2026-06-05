export function assetUrl(path: string): string {
  const base = (typeof __BASE__ !== "undefined" ? __BASE__ : "/").replace(
    /\/+$/,
    ""
  )
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${cleanPath}`
}
