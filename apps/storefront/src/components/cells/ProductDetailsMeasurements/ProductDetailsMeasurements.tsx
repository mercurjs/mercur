import { ProductPageAccordion } from '@/components/molecules/ProductPageAccordion/ProductPageAccordion';
import { ProdutMeasurementRow } from '@/components/molecules/ProdutMeasurementRow/ProdutMeasurementRow';
import { SingleProductMeasurement } from '@/types/product';

export const ProductDetailsMeasurements = ({
  measurements,
}: {
  measurements: SingleProductMeasurement[];
}) => {
  return (
    <ProductPageAccordion
      heading='Measurements'
      defaultOpen={false}
    >
      {measurements.map((item) => (
        <ProdutMeasurementRow
          key={item.label}
          measurement={item}
        />
      ))}
    </ProductPageAccordion>
  );
};
