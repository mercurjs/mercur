import { Module } from "@medusajs/framework/utils";

import TaxCodeService from "./service";

export const TAX_CODE_MODULE = "taxcode";
export { TaxCodeService };

export default Module(TAX_CODE_MODULE, {
  service: TaxCodeService,
});
