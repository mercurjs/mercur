import { useLoaderData, useParams } from "react-router-dom";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared";
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton";
import { useProductAttribute } from "../../../hooks/api";

import { AttributeGeneralSection } from "./components/attribute-general-section";
import { AttributePossibleValuesSection } from "./components/attribute-possible-values-section";
import { attributeDetailLoader } from "./loader";

export const AttributeDetailPage = () => {
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

  return (
    <LayoutComposer
      widgetsZonePrefix="attributes.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={attribute}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="AttributeGeneralSection">
              <AttributeGeneralSection attribute={attribute} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="AttributePossibleValuesSection">
              <AttributePossibleValuesSection attribute={attribute} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(attribute, { metadata: false })}
          </>
        ),
      }}
    />
  );
};
