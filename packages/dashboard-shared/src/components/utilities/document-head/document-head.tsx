import { ReactNode } from "react"
import { Helmet } from "react-helmet-async"
import { UIMatch, useMatches } from "react-router-dom"

import {
  formatDocumentTitle,
  titleFromCrumbs,
} from "../../../lib/document-title"

type BreadcrumbHandle = {
  breadcrumb?: (match?: UIMatch) => string | ReactNode
}

type DocumentHeadProps = {
  appName: string
  description: string
  pageTitle?: string
}

export const DocumentHead = ({
  appName,
  description,
  pageTitle,
}: DocumentHeadProps) => {
  const title = formatDocumentTitle(pageTitle, appName)

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Helmet>
  )
}

type RouteDocumentHeadProps = {
  appName: string
  description: string
}

export const RouteDocumentHead = ({
  appName,
  description,
}: RouteDocumentHeadProps) => {
  const matches = useMatches() as UIMatch<unknown, BreadcrumbHandle>[]
  const labels = matches.map((match) => {
    try {
      return match.handle?.breadcrumb?.(match)
    } catch {
      return undefined
    }
  })

  return (
    <DocumentHead
      appName={appName}
      description={description}
      pageTitle={titleFromCrumbs(labels)}
    />
  )
}
