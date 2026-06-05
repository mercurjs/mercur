import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useAttribute } from "../../../hooks/api"

import { AttributeGeneralSection } from "./components/attribute-general-section"
import { AttributePossibleValuesSection } from "./components/attribute-possible-values-section"
import { attributeDetailLoader } from "./loader"
import { ATTRIBUTE_DETAIL_FIELDS } from "./constants"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof attributeDetailLoader>
  >

  const { attribute, isPending, isError, error } = useAttribute(
    id!,
    { fields: ATTRIBUTE_DETAIL_FIELDS },
    {
      initialData: initialData as any,
    }
  )

  if (isPending || !attribute) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage hasOutlet data={attribute}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage hasOutlet data={attribute}>
      <AttributeGeneralSection attribute={attribute as any} />
      <AttributePossibleValuesSection attribute={attribute as any} />
    </SingleColumnPage>
  )
}

export const AttributeDetailPage = Object.assign(Root, {
  GeneralSection: AttributeGeneralSection,
  PossibleValuesSection: AttributePossibleValuesSection,
})
