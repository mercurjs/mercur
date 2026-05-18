import { ReactNode, Children } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton";
import { SingleColumnPage } from "../../../components/layout/pages";
import { useProductAttribute } from "../../../hooks/api";

import { AttributeGeneralSection } from "./components/attribute-general-section";
import { AttributePossibleValuesSection } from "./components/attribute-possible-values-section";
import { attributeDetailLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof attributeDetailLoader>
  >;

  const {
    product_attribute: attribute,
    isPending,
    isError,
    error,
  } = useProductAttribute(
    id!,
    {},
    {
      initialData: initialData,
    },
  );

  if (isPending || !attribute) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage hasOutlet showJSON data={attribute}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage hasOutlet showJSON data={attribute}>
      <AttributeGeneralSection attribute={attribute} />
      <AttributePossibleValuesSection attribute={attribute} />
    </SingleColumnPage>
  );
};

export const AttributeDetailPage = Object.assign(Root, {
  GeneralSection: AttributeGeneralSection,
  PossibleValuesSection: AttributePossibleValuesSection,
});
