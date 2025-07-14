import { MedusaContainer } from "@medusajs/framework";

/**
 * @method getAvgRating
 * @description This function calculates the average rating for a given entity type and ID
 * 
 * @param {MedusaContainer} container - Medusa infrastructure for database connectivity
 * @param {"seller" | "product"} type - Entity kind to calculate the average rating for
 * @param {string} id - The ID of the entity to calculate the average rating for
 * @returns {Promise<string>} Represents the completion of an asynchronous operation

 */
export async function getAvgRating(
  container: MedusaContainer,
  type: "seller" | "product",
  id: string
): Promise<string | null> {
  const knex = container.resolve("__pg_connection__");

  const joinField = type === "product" ? "product_id" : "seller_id";
  const joinTable =
    type === "product"
      ? "product_product_review_review"
      : "seller_seller_review_review";

  const [result] = await knex("review")
    .avg("review.rating")
    .leftJoin(joinTable, `${joinTable}.review_id`, "review.id")
    .where(`${joinTable}.${joinField}`, id);

  return result.avg;
}

/**
 * @method getSellersWithRating
 * @description This function "calculates average ratings for sellers based on product reviews"
 * 
 * @param {MedusaContainer} container - Medusa's ecosystem for database connectivity and utilities
 * @param {string[]} fields - The fields to select
 * @returns {Promise<any[]>} Represents the completion of an asynchronous operation

 */
export async function getSellersWithRating(
  container: MedusaContainer,
  fields: string[]
) {
  const knex = container.resolve("__pg_connection__");

  const result = await knex
    .select(...fields.map((f) => `seller.${f}`))
    .avg("review.rating as rating")
    .from("product")
    .leftJoin(
      "seller_seller_review_review",
      "seller.id",
      "seller_seller_review_review.product_id"
    )
    .leftJoin("review", "review.id", "seller_seller_review_review.review_id")
    .groupBy("seller.id");

  return result;
}

/**
 * @method getProductsWithRating
 * @description This function retrieves products with their average rating from the database
 * 
 * @param {MedusaContainer} container - The Medusa system's context for database connections
 * @param {string[]} fields - The fields to select
 * @returns {Promise<any[]>} Represents the completion of an asynchronous operation

 */
export async function getProductsWithRating(
  container: MedusaContainer,
  fields: string[]
) {
  const knex = container.resolve("__pg_connection__");

  const result = await knex
    .select(...fields.map((f) => `product.${f}`))
    .avg("review.rating as rating")
    .from("product")
    .leftJoin(
      "product_product_review_review",
      "product.id",
      "product_product_review_review.product_id"
    )
    .leftJoin("review", "review.id", "product_product_review_review.review_id")
    .groupBy("product.id");

  return result;
}
