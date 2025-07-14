import { model } from "@medusajs/framework/utils";

/**
 * @class Brand
 * @description Represents a brand in the system.
 *
 * This model defines the structure for storing brand information. Each brand has a unique
 * identifier and a name, which can be used to categorize products or services. Brands
 * are commonly used in e-commerce platforms to group products by manufacturer or supplier.
 */
export const Brand = model.define("brand", {
  /**
   * @property {string} id - Unique identifier for the brand
   * @description Auto-generated primary key
   */
  id: model.id().primaryKey(),

  /**
   * @property {string} name - The name of the brand
   * @description The human-readable name of the brand
   * @example "Apple", "Samsung", "Nike"
   */
  name: model.text(),
});
