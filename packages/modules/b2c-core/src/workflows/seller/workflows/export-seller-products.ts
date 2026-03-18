import {
  generateProductCsvStep,
  useRemoteQueryStep
} from '@medusajs/medusa/core-flows';
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk';

import { getSellerProductsStep } from '../steps';

type ExportSellerProductsInput = {
  seller_id: string;
  product_ids?: string[];
};

export const exportSellerProductsWorkflow = createWorkflow(
  'export-seller-products',
  function (input: ExportSellerProductsInput) {
    const products = getSellerProductsStep(input);

    const file = generateProductCsvStep(products);
    const fileDetails = useRemoteQueryStep({
      fields: ['id', 'url'],
      entry_point: 'file',
      variables: { id: file.id },
      list: false
    });

    return new WorkflowResponse(fileDetails);
  }
);
