/**
 * Filters out null values from seller.products in the product response
 */
export function filterNullSellerProducts(products) {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.map((product) => {
    if (!product) {
      return product;
    }

    if (product.seller && Array.isArray(product.seller.products)) {
      return {
        ...product,
        seller: {
          ...product.seller,
          products: product.seller.products.filter(
            (sellerProduct) =>
              sellerProduct !== null &&
              sellerProduct !== undefined &&
              typeof sellerProduct === "object" &&
              sellerProduct.id !== null &&
              sellerProduct.id !== undefined
          ),
        },
      };
    }

    return product;
  });
}
