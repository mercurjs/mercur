import { useParams } from "react-router-dom";

import { ProductRequestDetail } from "./product-detail";

const ProductRequestDetailPage = () => {
  const { id } = useParams();

  return <ProductRequestDetail id={id!} />;
};

export default ProductRequestDetailPage;
