/**
 * Last string breadcrumb wins. ReactNode crumbs (avatars, status chips) are
 * skipped so the document title stays plain text.
 */
export const crumbToTitle = (label: unknown): string | undefined => {
  if (typeof label !== "string") {
    return undefined
  }

  const trimmed = label.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const titleFromCrumbs = (labels: unknown[]): string | undefined => {
  for (let index = labels.length - 1; index >= 0; index--) {
    const title = crumbToTitle(labels[index])
    if (title) {
      return title
    }
  }

  return undefined
}

export const formatDocumentTitle = (
  page: string | undefined,
  appName: string
): string => {
  const trimmed = page?.trim()
  if (!trimmed) {
    return appName
  }

  return `${trimmed} | ${appName}`
}
