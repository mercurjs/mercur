import { model } from "@medusajs/utils";

/**
 * @class TaxCode
 * @description Represents a tax code in the system.
 *
 * This model defines the structure for storing tax code information. Each tax code
 * is associated with a specific name, description, and code.
 */
const TaxCode = model.define("tax_code", {
  /**
   * @property {string} id - The ID of the tax code.
   * @description Auto-generated primary key with prefix 'taxc'
   * @example "taxc_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "taxc" }).primaryKey(),
  /**
   * @property {string} name - The name of the tax code.
   * @description The name of the tax code.
   * @example "Sales Tax"
   */
  name: model.text().default(""),
  /**
   * @property {string} description - The description of the tax code.
   * @description The description of the tax code.
   * @example "Tax code for sales tax"
   */
  description: model.text().default(""),
  /**
   * @property {string} code - The code of the tax code.
   * @description The code of the tax code.
   * @example "12345"
   */
  code: model.text().unique(),
});

export default TaxCode;
