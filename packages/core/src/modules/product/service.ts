import {
  Context,
  FindConfig,
  ModuleJoinerConfig,
} from "@medusajs/framework/types";
import {
  defineJoinerConfig,
  InjectTransactionManager,
  kebabCase,
  MedusaError,
  MedusaService,
  Modules,
  isValidHandle,
  promiseAll,
  toHandle,
} from "@medusajs/framework/utils";
import {
  AttributeType,
  CreateProductAttributeDTO,
  CreateProductAttributeValueDTO,
  CreateProductBrandDTO,
  CreateProductDTO,
  CreateProductVariantDTO,
  ProductAttributeDTO,
  ProductBrandDTO,
  ProductChangeActionDTO,
  ProductChangeActionType,
  ProductChangeStatus,
  ProductDTO,
  ProductVariantDTO,
  UpdateProductAttributeDTO,
  UpdateProductAttributeValueDTO,
  UpdateProductBrandDTO,
  UpdateProductDTO,
  UpdateProductVariantDTO,
  UpsertProductAttributeValueDTO,
  UpsertProductVariantDTO,
} from "@mercurjs/types";

import {
  Product,
  ProductAttribute,
  ProductAttributeValue,
  ProductBrand,
  ProductCategory,
  ProductChange,
  ProductChangeAction,
  ProductCollection,
  ProductImage,
  ProductTag,
  ProductType,
  ProductVariant,
  ProductVariantProductImage,
} from "./models";
import ProductCategoryService from "./services/product-category";

type UpdateCategoryInput = {
  id: string;
  name?: string;
  description?: string;
  handle?: string;
  is_active?: boolean;
  is_internal?: boolean;
  is_restricted?: boolean;
  rank?: number;
  parent_category_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

type AddProductActionInput = {
  product_change_id: string;
  product_id: string;
  action: string;
  details?: Record<string, unknown>;
  internal_note?: string;
  /**
   * When true the action is recorded as already-applied — used by admin
   * workflows that create the parent change in `CONFIRMED` state and
   * apply product mutations directly (e.g. reject/request-changes).
   * Skips the parent-change `PENDING` validation since the change is
   * known to be closed at creation time.
   */
  applied?: boolean;
};


interface InjectedDependencies {
  productCategoryService: ProductCategoryService;
}

class ProductModuleService extends MedusaService({
  Product,
  ProductAttribute,
  ProductAttributeValue,
  ProductBrand,
  ProductCategory,
  ProductChange,
  ProductChangeAction,
  ProductCollection,
  ProductImage,
  ProductTag,
  ProductType,
  ProductVariant,
  ProductVariantProductImage,
}) {
  protected readonly productCategoryService_: ProductCategoryService;

  constructor(container: InjectedDependencies) {
    super(...arguments);
    this.productCategoryService_ = container.productCategoryService;
  }

  __joinerConfig(): ModuleJoinerConfig {
    return defineJoinerConfig(Modules.PRODUCT, {
      models: [
        Product,
        ProductAttribute,
        ProductAttributeValue,
        ProductBrand,
        ProductCategory,
        ProductChange,
        ProductChangeAction,
        ProductCollection,
        ProductImage,
        ProductTag,
        ProductType,
        ProductVariant,
        ProductVariantProductImage,
      ],
      alias: [
        {
          name: [
            "product_variant",
            "product_variants",
            "variant",
            "variants",
          ],
          entity: "ProductVariant",
          args: {
            methodSuffix: "ProductVariants",
          },
        },
      ],
    });
  }

  // @ts-expect-error
  async retrieveProduct(
    id: string,
    config?: FindConfig<any> | undefined,
    sharedContext?: Context
  ): Promise<any> {
    const product = await super.retrieveProduct(id, config, sharedContext);

    const productChange = await this.getActiveProductChange_(
      product.id,
      false,
      sharedContext
    );

    (product as any).product_change = productChange;

    this.formatProductAttributes_(product);

    return product;
  }

  // @ts-expect-error
  async listProducts(
    filters?: Record<string, any>,
    config?: FindConfig<any>,
    sharedContext?: Context
  ): Promise<any[]> {
    const products = await super.listProducts(
      filters,
      config,
      sharedContext
    );

    for (const product of products as any[]) {
      this.formatProductAttributes_(product);
    }

    return products;
  }

  // @ts-expect-error
  async listAndCountProducts(
    filters?: Record<string, any>,
    config?: FindConfig<any>,
    sharedContext?: Context
  ): Promise<[any[], number]> {
    const [products, count] = await super.listAndCountProducts(
      filters,
      config,
      sharedContext
    );

    for (const product of products as any[]) {
      this.formatProductAttributes_(product);
    }

    return [products, count];
  }

  /**
   * Computes a unified `attributes` array on the product by merging
   * variant_attributes, custom_attributes, and attribute_values into
   * a single grouped structure with values nested under each attribute.
   */
  private formatProductAttributes_(product: any): void {
    const hasAttrData =
      product.variant_attributes ||
      product.custom_attributes ||
      product.attribute_values;

    if (!hasAttrData) return;

    const attrsById = new Map<string, any>();

    // Add variant_attributes (global or product-scoped, used as variant axes)
    for (const attr of product.variant_attributes ?? []) {
      attrsById.set(attr.id, { ...attr, values: [...(attr.values ?? [])] });
    }

    // Add custom_attributes (product-scoped, non-variant)
    for (const attr of product.custom_attributes ?? []) {
      if (!attrsById.has(attr.id)) {
        attrsById.set(attr.id, {
          ...attr,
          values: [...(attr.values ?? [])],
        });
      }
    }

    // Add attributes discovered only via attribute_values
    // (global non-variant attributes linked through values)
    for (const val of product.attribute_values ?? []) {
      if (!val.attribute) continue;
      const attrId = val.attribute.id ?? val.attribute_id;
      if (!attrId || attrsById.has(attrId)) continue;
      attrsById.set(attrId, { ...val.attribute, values: [] });
    }

    // Filter each attribute's values to only those linked to this product
    const productValueIds = new Set(
      (product.attribute_values ?? []).map((v: any) => v.id)
    );

    for (const attr of attrsById.values()) {
      attr.values = (attr.values ?? []).filter((v: any) =>
        productValueIds.has(v.id)
      );
      attr.values.sort(
        (a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0)
      );
    }

    // Sort attributes by rank
    product.attributes = [...attrsById.values()].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
    );
  }

  private async getActiveProductChange_(
    productId: string,
    includeActions: boolean,
    sharedContext?: Context
  ): Promise<any> {
    const options: Record<string, any> = {
      select: [
        "id",
        "product_id",
        "status",
        "internal_note",
        "external_note",
        "created_by",
        "confirmed_by",
        "confirmed_at",
        "declined_by",
        "declined_at",
        "declined_reason",
        "canceled_by",
        "canceled_at",
      ],
      relations: [] as string[],
      order: {},
    };

    if (includeActions) {
      options.select.push("actions");
      options.relations.push("actions");
      options.order = {
        actions: {
          ordering: "ASC",
        },
      };
    }

    const [productChange] = await this.listProductChanges(
      {
        product_id: productId,
        status: [ProductChangeStatus.PENDING],
      },
      options,
      sharedContext
    );

    return productChange;
  }

  private validateProductHandle_(handle?: string): void {
    if (handle && !isValidHandle(handle)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid product handle '${handle}'. It must contain URL safe characters`
      );
    }
  }

  private validateProductAttributeType_(
    attr: Partial<
      Pick<
        CreateProductAttributeDTO,
        "name" | "type" | "is_variant_axis" | "is_filterable"
      >
    > & { id?: string }
  ): void {
    const VARIANT_AXIS_ALLOWED = new Set<AttributeType>([
      AttributeType.MULTI_SELECT,
    ]);
    const FILTERABLE_ALLOWED = new Set<AttributeType>([
      AttributeType.SINGLE_SELECT,
      AttributeType.MULTI_SELECT,
      AttributeType.TOGGLE,
      AttributeType.UNIT,
    ]);

    if (
      attr.is_variant_axis &&
      attr.type &&
      !VARIANT_AXIS_ALLOWED.has(attr.type)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Attribute '${attr.name ?? attr.id ?? "(unnamed)"}' (type=${attr.type}) cannot be a variant axis. Only multi_select attributes may drive variants.`
      );
    }

    if (
      attr.is_filterable &&
      attr.type &&
      !FILTERABLE_ALLOWED.has(attr.type)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Attribute '${attr.name ?? attr.id ?? "(unnamed)"}' (type=${attr.type}) cannot be filterable. Only single_select, multi_select, toggle, and unit attributes are filterable.`
      );
    }
  }

  private async normalizeProductInput_(
    products: any[],
    sharedContext?: Context
  ): Promise<any[]> {
    for (const product of products) {
      // Handle
      this.validateProductHandle_(product.handle);
      if (!product.handle && product.title) {
        product.handle = toHandle(product.title);
      }

      // Dimension fields: API accepts numbers, model stores as text
      if ("weight" in product) {
        product.weight = product.weight?.toString() as any;
      }
      if ("length" in product) {
        product.length = product.length?.toString() as any;
      }
      if ("height" in product) {
        product.height = product.height?.toString() as any;
      }
      if ("width" in product) {
        product.width = product.width?.toString() as any;
      }

      // M:M refs → plain IDs (Medusa pattern: MikroORM needs IDs, not { id } objects)
      if (product.categories?.length) {
        product.categories = product.categories.map(
          (c: { id: string } | string) => (typeof c === "string" ? c : c.id)
        );
      }
      if (product.tags?.length) {
        product.tags = product.tags.map(
          (t: { id: string } | string) => (typeof t === "string" ? t : t.id)
        );
      }
    }

    // Attribute normalization (variant attrs, product-level attr values, variant attr values)
    const hasAttributeInput = products.some(
      (p) =>
        p.variant_attributes !== undefined ||
        p.product_attributes !== undefined ||
        (Array.isArray(p.variants) &&
          p.variants.some((v: any) => v?.attribute_values !== undefined))
    );

    if (hasAttributeInput) {
      await this.normalizeAttributes_(products, sharedContext);
    }

    return products;
  }

  /**
   * Normalizes product attribute inputs:
   *
   * **`variant_attributes`** — each entry is either:
   *   1. Global attribute ref: `{ attribute_id, value_ids }` → links via M2M
   *   2. Inline custom attr: `{ name, type, values }` → creates ProductAttribute + values
   *
   * **`product_attributes`** — non-variant attributes, same format as variant_attributes.
   *   Creates product-scoped attributes and links their values to the product.
   *
   * **`variant.attribute_values`** — `Record<string, string | string[]>`
   *   keyed by attribute name/handle, resolved to ProductAttributeValue IDs per variant.
   */
  private async normalizeAttributes_(
    products: any[],
    sharedContext?: Context
  ): Promise<void> {
    // Collect all global attribute IDs referenced (from variant_attributes and product attribute_values)
    const attrIds = new Set<string>();
    for (const product of products) {
      for (const input of product.variant_attributes ?? []) {
        if (input.attribute_id) attrIds.add(input.attribute_id);
      }
      for (const input of product.product_attributes ?? []) {
        if (input.attribute_id) attrIds.add(input.attribute_id);
      }
    }

    // Batch-load referenced global attributes with their values
    const attrsById = new Map<string, any>();
    if (attrIds.size) {
      const attrs = await super.listProductAttributes(
        { id: Array.from(attrIds) } as any,
        { relations: ["values"] },
        sharedContext
      );
      for (const a of attrs as any[]) {
        attrsById.set(a.id, a);
      }
    }

    // Process each product
    for (const product of products) {
      // Lookup: attr name/handle/id → value name → ProductAttributeValue id
      // Shared across variant_attributes + product attribute_values + variant attribute_values
      const valueLookup = new Map<string, Map<string, string>>();

      const variantAttrValueIds: string[] = [];
      const variantCustomAttributeIds: string[] = [];
      const productAttrValueIds: string[] = [];
      const customAttributeIds: string[] = [];

      // Collect IDs of all inline-created attributes so we can batch-fetch
      // their values in a single query after both loops.
      const createdInlineAttrIds: string[] = [];

      // --- Process variant_attributes ---
      const attrsInput = product.variant_attributes as any[] | undefined;
      if (attrsInput?.length) {
        const variantAttributeIds: string[] = [];

        for (const input of attrsInput) {
          if (input.attribute_id) {
            // Global attribute reference
            const attr = attrsById.get(input.attribute_id);
            if (!attr) {
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Product attribute with id '${input.attribute_id}' was not found`
              );
            }

            variantAttributeIds.push(attr.id);

            // Validate value_ids if provided
            const attrValuesById = new Map<string, any>();
            for (const v of attr.values ?? []) {
              attrValuesById.set(v.id, v);
            }

            if (input.value_ids?.length) {
              for (const vid of input.value_ids) {
                if (!attrValuesById.has(vid)) {
                  throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    `Attribute value with id '${vid}' was not found on attribute '${attr.name}'`
                  );
                }
                variantAttrValueIds.push(vid);
              }
            }

            // Build lookup
            this.addAttrToLookup_(attr, valueLookup);
          } else {
            // Inline custom attribute — create ProductAttribute + values
            const customAttr = await this.createProductAttributes(
              {
                name: input.name,
                type: input.type,
                handle: input.name ? toHandle(input.name) : undefined,
                is_variant_axis: input.is_variant_axis ?? false,
                is_filterable: input.is_filterable ?? false,
                is_required: input.is_required ?? false,
                description: input.description ?? null,
                product_id: product.id ?? null,
                metadata: input.metadata ?? null,
                values: (input.values ?? []).map((v: string, i: number) => ({
                  name: v,
                  handle: toHandle(v),
                  rank: i,
                })),
              },
              sharedContext
            );

            variantAttributeIds.push(customAttr.id);
            variantCustomAttributeIds.push(customAttr.id);
            createdInlineAttrIds.push(customAttr.id);
          }
        }

        // Set M2M variant_attributes as IDs
        product.variant_attributes = variantAttributeIds;
      }

      // --- Process product_attributes (non-variant) ---
      const productAttrsInput = product.product_attributes as any[] | undefined;
      if (productAttrsInput?.length) {
        for (const input of productAttrsInput) {
          if (input.attribute_id) {
            // Global attribute reference
            const attr = attrsById.get(input.attribute_id);
            if (!attr) {
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Product attribute with id '${input.attribute_id}' was not found`
              );
            }

            this.addAttrToLookup_(attr, valueLookup);

            // Collect specified value IDs
            if (input.value_ids?.length) {
              const attrValuesById = new Map<string, any>();
              for (const v of attr.values ?? []) {
                attrValuesById.set(v.id, v);
              }
              for (const vid of input.value_ids) {
                if (!attrValuesById.has(vid)) {
                  throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    `Attribute value with id '${vid}' was not found on attribute '${attr.name}'`
                  );
                }
                productAttrValueIds.push(vid);
              }
            }

            // Upsert values by name (for text/unit/toggle attributes)
            if (input.values?.length) {
              const existingByName = new Map<string, string>();
              for (const v of attr.values ?? []) {
                existingByName.set(v.name, v.id);
              }

              const toCreate: string[] = [];
              for (const name of input.values) {
                const existingId = existingByName.get(name);
                if (existingId) {
                  productAttrValueIds.push(existingId);
                } else {
                  toCreate.push(name);
                }
              }

              if (toCreate.length) {
                const created = await this.createProductAttributeValues(
                  toCreate.map((name, i) => ({
                    name,
                    handle: toHandle(name),
                    rank: (attr.values?.length ?? 0) + i,
                    attribute_id: attr.id,
                  })),
                  sharedContext
                );
                const createdArr = Array.isArray(created)
                  ? created
                  : [created];
                for (const v of createdArr) {
                  productAttrValueIds.push(v.id);
                }
              }
            }
          } else {
            // Inline custom attribute — create and collect value IDs
            const customAttr = await this.createProductAttributes(
              {
                name: input.name,
                type: input.type,
                handle: input.name ? toHandle(input.name) : undefined,
                is_variant_axis: false,
                is_filterable: input.is_filterable ?? false,
                is_required: input.is_required ?? false,
                description: input.description ?? null,
                product_id: product.id ?? null,
                metadata: input.metadata ?? null,
                values: (input.values ?? []).map((v: string, i: number) => ({
                  name: v,
                  handle: toHandle(v),
                  rank: i,
                })),
              },
              sharedContext
            );

            customAttributeIds.push(customAttr.id);
            createdInlineAttrIds.push(customAttr.id);
          }
        }

        delete product.product_attributes;
      }

      // Batch-fetch all inline-created attributes with their values in a single query
      // instead of calling retrieveProductAttribute inside each loop iteration.
      if (createdInlineAttrIds.length) {
        const createdAttrs = await super.listProductAttributes(
          { id: createdInlineAttrIds } as any,
          { relations: ["values"] },
          sharedContext
        );

        const createdAttrsById = new Map<string, any>();
        for (const a of createdAttrs as any[]) {
          createdAttrsById.set(a.id, a);
        }

        // Collect value IDs and build lookups from inline-created attributes
        for (const attrId of variantCustomAttributeIds) {
          const attr = createdAttrsById.get(attrId);
          if (!attr) continue;
          this.addAttrToLookup_(attr, valueLookup);
          for (const v of attr.values ?? []) {
            variantAttrValueIds.push(v.id);
          }
        }
        for (const attrId of customAttributeIds) {
          const attr = createdAttrsById.get(attrId);
          if (!attr) continue;
          this.addAttrToLookup_(attr, valueLookup);
          for (const v of attr.values ?? []) {
            productAttrValueIds.push(v.id);
          }
        }
      }

      // Stash custom attribute IDs — product_id will be set after product creation
      const allPendingCustomAttrIds = [
        ...variantCustomAttributeIds,
        ...customAttributeIds,
      ];
      if (allPendingCustomAttrIds.length) {
        product.__pending_custom_attribute_ids = allPendingCustomAttrIds;
      }

      // Merge variant + product attribute value IDs into attribute_values
      const allAttrValueIds = [
        ...variantAttrValueIds,
        ...productAttrValueIds,
      ];
      if (allAttrValueIds.length) {
        const existing = Array.isArray(product.attribute_values)
          ? product.attribute_values
          : [];
        product.attribute_values = [...existing, ...allAttrValueIds];
      }

      // --- Resolve variant.attribute_values ---
      if (Array.isArray(product.variants)) {
        const hasMapValues = product.variants.some(
          (v: any) =>
            v?.attribute_values !== undefined &&
            !Array.isArray(v.attribute_values)
        );

        // If variants use map-style attribute_values but no variant_attributes
        // were provided in this call, load existing product variant attributes
        // to build the lookup for resolution.
        if (hasMapValues && valueLookup.size === 0 && product.id) {
          const existingProduct = await this.retrieveProduct(
            product.id,
            {
              select: ["id"],
              relations: ["variant_attributes", "variant_attributes.values"],
            } as any,
            sharedContext
          );

          for (const attr of (existingProduct as any).variant_attributes ??
            []) {
            this.addAttrToLookup_(attr, valueLookup);
          }
        }

        for (const variant of product.variants) {
          if (variant?.attribute_values === undefined) continue;
          if (Array.isArray(variant.attribute_values)) continue;

          variant.attribute_values = this.resolveValueMap_(
            variant.attribute_values as Record<string, string | string[]>,
            valueLookup
          );
        }
      }
    }
  }

  /**
   * Resolves map-style `attribute_values` on variants to arrays of
   * `ProductAttributeValue` IDs. Variants with `attribute_values` already
   * an array of IDs (or undefined) are left untouched.
   *
   * Looks up each variant's parent product's `variant_attributes` (and their
   * values) to translate `{ attrKey: "valueName" }` to value IDs.
   */
  private async normalizeVariantAttributeValues_(
    variants: Array<{
      id?: string;
      product_id?: string;
      attribute_values?: string[] | Record<string, string | string[]>;
    }>,
    sharedContext?: Context
  ): Promise<void> {
    const mapVariants = variants.filter(
      (v) =>
        v.attribute_values !== undefined &&
        !Array.isArray(v.attribute_values) &&
        typeof v.attribute_values === "object"
    );

    if (!mapVariants.length) return;

    // Resolve missing product_ids by looking up variants by id
    const variantIdsNeedingProductId = mapVariants
      .filter((v) => !v.product_id && v.id)
      .map((v) => v.id) as string[];

    if (variantIdsNeedingProductId.length) {
      const existing = await super.listProductVariants(
        { id: variantIdsNeedingProductId } as any,
        { select: ["id", "product_id"] as any },
        sharedContext
      );

      const variantToProductId = new Map<string, string>();
      for (const v of existing as any[]) {
        if (v.product_id) variantToProductId.set(v.id, v.product_id);
      }

      for (const v of mapVariants) {
        if (!v.product_id && v.id) {
          v.product_id = variantToProductId.get(v.id);
        }
      }
    }

    const productIds = Array.from(
      new Set(mapVariants.map((v) => v.product_id).filter(Boolean))
    ) as string[];

    if (!productIds.length) return;

    // Build per-product lookup from variant_attributes + values
    const products = await this.listProducts(
      { id: productIds } as any,
      {
        select: ["id"] as any,
        relations: ["variant_attributes", "variant_attributes.values"],
      },
      sharedContext
    );

    const productLookups = new Map<string, Map<string, Map<string, string>>>();
    for (const product of products as any[]) {
      const lookup = new Map<string, Map<string, string>>();
      for (const attr of product.variant_attributes ?? []) {
        this.addAttrToLookup_(attr, lookup);
      }
      productLookups.set(product.id, lookup);
    }

    for (const variant of mapVariants) {
      if (!variant.product_id) continue;
      const lookup = productLookups.get(variant.product_id);
      if (!lookup) continue;

      variant.attribute_values = this.resolveValueMap_(
        variant.attribute_values as Record<string, string | string[]>,
        lookup
      );
    }
  }

  /**
   * Adds an attribute's values to the lookup map (name/handle/id → value name → value id).
   */
  private addAttrToLookup_(
    attr: any,
    lookup: Map<string, Map<string, string>>
  ): void {
    const valueMap = new Map<string, string>();
    for (const v of attr.values ?? []) {
      valueMap.set(v.name, v.id);
      if (v.handle) valueMap.set(v.handle, v.id);
    }
    if (attr.handle) lookup.set(attr.handle, valueMap);
    if (attr.name) lookup.set(attr.name, valueMap);
    lookup.set(attr.id, valueMap);
  }

  /**
   * Resolves `{ attrKey: "valueName" | ["v1", "v2"] }` → array of ProductAttributeValue IDs.
   */
  private resolveValueMap_(
    input: Record<string, string | string[]>,
    lookup: Map<string, Map<string, string>>
  ): string[] {
    const resolvedIds: string[] = [];
    for (const [key, raw] of Object.entries(input)) {
      const valueMap = lookup.get(key);
      if (!valueMap) continue;

      const vals = Array.isArray(raw) ? raw : [raw];
      for (const v of vals) {
        const valueId = valueMap.get(v);
        if (valueId) resolvedIds.push(valueId);
      }
    }
    return resolvedIds;
  }

  // @ts-expect-error
  async retrieveProductAttribute(
    id: string,
    config?: FindConfig<any>,
    sharedContext?: Context
  ): Promise<any> {
    const attribute = await super.retrieveProductAttribute(
      id,
      config,
      sharedContext
    );

    await this.resolveSelectAttributeValues_(
      [attribute as any],
      config,
      sharedContext
    );

    return attribute;
  }

  // @ts-expect-error
  async listProductAttributes(
    filters?: Record<string, any>,
    config?: FindConfig<any>,
    sharedContext?: Context
  ): Promise<any[]> {
    const attributes = await super.listProductAttributes(
      filters,
      config,
      sharedContext
    );

    await this.resolveSelectAttributeValues_(
      attributes as any[],
      config,
      sharedContext
    );

    return attributes;
  }

  // @ts-expect-error
  async listAndCountProductAttributes(
    filters?: Record<string, any>,
    config?: FindConfig<any>,
    sharedContext?: Context
  ): Promise<[any[], number]> {
    const [attributes, count] = await super.listAndCountProductAttributes(
      filters,
      config,
      sharedContext
    );

    await this.resolveSelectAttributeValues_(
      attributes as any[],
      config,
      sharedContext
    );

    return [attributes, count];
  }

  /**
   * For attributes with type single_select or multi_select, resolves their
   * values via listProductAttributeValues. Non-select attributes keep values empty.
   * Only runs when the caller requested the "values" relation.
   */
  private async resolveSelectAttributeValues_(
    attributes: any[],
    config?: FindConfig<any>,
    sharedContext?: Context
  ): Promise<void> {
    const requestedRelations = (config?.relations ?? []) as string[];
    if (!requestedRelations.includes("values")) return;
    if (!attributes.length) return;

    const SELECT_TYPES = new Set([
      AttributeType.SINGLE_SELECT,
      AttributeType.MULTI_SELECT,
    ]);

    const selectAttrIds: string[] = [];

    for (const attr of attributes) {
      if (SELECT_TYPES.has(attr.type)) {
        selectAttrIds.push(attr.id);
      } else {
        // Non-select types: clear values
        attr.values = [];
      }
    }

    if (!selectAttrIds.length) return;

    // Batch-fetch values for all select-type attributes
    const values = await super.listProductAttributeValues(
      { attribute_id: selectAttrIds } as any,
      { order: { rank: "ASC" } as any },
      sharedContext
    );

    // Group values by attribute_id
    const valuesByAttrId = new Map<string, any[]>();
    for (const val of values as any[]) {
      const attrId = val.attribute_id ?? val.attribute?.id;
      if (!attrId) continue;
      if (!valuesByAttrId.has(attrId)) {
        valuesByAttrId.set(attrId, []);
      }
      valuesByAttrId.get(attrId)!.push(val);
    }

    // Map values onto attributes
    for (const attr of attributes) {
      if (SELECT_TYPES.has(attr.type)) {
        attr.values = valuesByAttrId.get(attr.id) ?? [];
      }
    }
  }

  @InjectTransactionManager()
  // @ts-ignore
  async createProductAttributes<
    TInput extends CreateProductAttributeDTO | CreateProductAttributeDTO[]
  >(
    data: TInput,
    sharedContext?: Context
  ): Promise<
    TInput extends CreateProductAttributeDTO[]
    ? ProductAttributeDTO[]
    : ProductAttributeDTO
  > {
    const input = (Array.isArray(data) ? data : [data]).map((attr) => {
      this.validateProductAttributeType_(attr);

      if (!attr.handle && attr.name) {
        attr.handle = toHandle(attr.name);
      }

      return attr;
    });

    const result = await super.createProductAttributes(
      input as any,
      sharedContext
    );

    // When product_id is set, link created attributes and their values to the product
    const created = Array.isArray(result) ? result : [result];
    const attrsWithProductId = created.filter(
      (attr) => !!(attr as any).product_id
    );

    if (attrsWithProductId.length) {
      // Batch-fetch all created attributes with values in a single query
      const attrIdsToFetch = attrsWithProductId.map((a) => a.id);
      const fetchedAttrs = await super.listProductAttributes(
        { id: attrIdsToFetch } as any,
        { relations: ["values"] },
        sharedContext
      );
      const fetchedAttrsById = new Map<string, any>();
      for (const a of fetchedAttrs as any[]) {
        fetchedAttrsById.set(a.id, a);
      }

      // Batch-fetch all referenced products in a single query
      const productIds = [
        ...new Set(attrsWithProductId.map((a) => (a as any).product_id)),
      ];
      const products = await this.listProducts(
        { id: productIds } as any,
        {
          select: ["id"] as any,
          relations: ["attribute_values", "variant_attributes"],
        },
        sharedContext
      );
      const productsById = new Map<string, any>();
      for (const p of products as any[]) {
        productsById.set(p.id, p);
      }

      // Build update payloads per product
      const updatesByProductId = new Map<string, Record<string, any>>();

      for (const attr of attrsWithProductId) {
        const productId = (attr as any).product_id;
        const fetchedAttr = fetchedAttrsById.get(attr.id);
        const product = productsById.get(productId);
        if (!product) continue;

        if (!updatesByProductId.has(productId)) {
          updatesByProductId.set(productId, {
            id: productId,
            attribute_values: [
              ...new Set(
                ((product as any).attribute_values ?? []).map(
                  (v: any) => v.id
                )
              ),
            ],
            variant_attributes: [
              ...new Set(
                ((product as any).variant_attributes ?? []).map(
                  (a: any) => a.id
                )
              ),
            ],
          });
        }

        const payload = updatesByProductId.get(productId)!;

        // Merge attribute value IDs
        const valueIds = ((fetchedAttr as any)?.values ?? []).map(
          (v: any) => v.id
        );
        for (const vid of valueIds) {
          if (!payload.attribute_values.includes(vid)) {
            payload.attribute_values.push(vid);
          }
        }

        // Merge variant attribute ID
        if ((attr as any).is_variant_axis) {
          if (!payload.variant_attributes.includes(attr.id)) {
            payload.variant_attributes.push(attr.id);
          }
        }
      }

      // Apply all product updates
      await promiseAll(
        Array.from(updatesByProductId.values()).map((payload) =>
          super.updateProducts(payload as any, sharedContext)
        )
      );
    }

    return (Array.isArray(data) ? result : result[0]) as any;
  }

  /**
   * Adds existing global attributes to a product by linking them via the
   * variant_attributes M2M and their values via the attribute_values M2M.
   */
  @InjectTransactionManager()
  async addAttributesToProduct(
    productId: string,
    items: {
      attribute_id: string
      attribute_value_ids?: string[]
      values?: string[]
    }[],
    sharedContext?: Context
  ): Promise<void> {
    if (!items.length) return;

    const product = await this.retrieveProduct(
      productId,
      {
        select: ["id"],
        relations: ["variant_attributes", "attribute_values"],
      } as any,
      sharedContext
    );

    const existingVariantAttrIds = new Set(
      ((product as any).variant_attributes ?? []).map((a: any) => a.id)
    );
    const existingValueIds = new Set(
      ((product as any).attribute_values ?? []).map((v: any) => v.id)
    );

    // Batch-fetch all referenced attributes with their values in a single query
    const attrIdsToFetch = items.map((item) => item.attribute_id);
    const fetchedAttrs = await super.listProductAttributes(
      { id: attrIdsToFetch } as any,
      { relations: ["values"] },
      sharedContext
    );
    const fetchedAttrsById = new Map<string, any>();
    for (const a of fetchedAttrs as any[]) {
      fetchedAttrsById.set(a.id, a);
    }

    const newAttrIds = new Set<string>();
    const newValueIds = new Set<string>();

    for (const item of items) {
      const attr = fetchedAttrsById.get(item.attribute_id);
      if (!attr) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product attribute with id '${item.attribute_id}' was not found`
        );
      }

      if (attr.product_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Attribute '${item.attribute_id}' is product-scoped and cannot be linked to another product`
        );
      }

      newAttrIds.add(attr.id);

      // Determine which value IDs to link
      const attrValues = (attr.values ?? []) as {
        id: string
        name: string
      }[];

      if (item.attribute_value_ids?.length) {
        // Select types — reference existing value IDs
        const validIds = new Set(attrValues.map((v) => v.id));
        for (const vid of item.attribute_value_ids) {
          if (!validIds.has(vid)) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Attribute value '${vid}' not found on attribute '${attr.name}'`
            );
          }
          newValueIds.add(vid);
        }
      } else if (item.values?.length) {
        // Text/unit/toggle types — find-or-create values by name
        const existingByName = new Map<string, string>();
        for (const v of attrValues) {
          existingByName.set(v.name, v.id);
        }

        const toCreate: string[] = [];
        for (const name of item.values) {
          const existingId = existingByName.get(name);
          if (existingId) {
            newValueIds.add(existingId);
          } else {
            toCreate.push(name);
          }
        }

        if (toCreate.length) {
          const created = await this.createProductAttributeValues(
            toCreate.map((name, i) => ({
              name,
              handle: toHandle(name),
              rank: attrValues.length + i,
              attribute_id: attr.id,
            })),
            sharedContext
          );
          const createdArr = Array.isArray(created) ? created : [created];
          for (const v of createdArr) {
            newValueIds.add(v.id);
          }
        }
      } else {
        // No specific values — link all existing values
        for (const v of attrValues) {
          newValueIds.add(v.id);
        }
      }
    }

    const mergedAttrIds = [
      ...new Set([...existingVariantAttrIds, ...newAttrIds]),
    ];
    const mergedValueIds = [
      ...new Set([...existingValueIds, ...newValueIds]),
    ];

    await super.updateProducts(
      {
        id: productId,
        variant_attributes: mergedAttrIds,
        attribute_values: mergedValueIds,
      } as any,
      sharedContext
    );
  }

  /**
   * Removes attributes from a product.
   *
   * - If an attribute is a variant axis and any product variant references its
   *   values, the removal is rejected (variants must be deleted first).
   * - If an attribute is global (no product_id), it is unlinked from the
   *   product's M2M relations.
   * - If an attribute is product-scoped (product_id matches), it is soft-deleted.
   */
  @InjectTransactionManager()
  async removeAttributeFromProduct(
    productId: string,
    attributeIds: string | string[],
    sharedContext?: Context
  ): Promise<void> {
    const ids = Array.isArray(attributeIds) ? attributeIds : [attributeIds];
    if (!ids.length) return;

    const product = await this.retrieveProduct(
      productId,
      {
        select: ["id"],
        relations: [
          "variant_attributes",
          "attribute_values",
          "variants",
          "variants.attribute_values",
        ],
      } as any,
      sharedContext
    );

    // Batch-fetch all attributes with their values
    const attributes = await super.listProductAttributes(
      { id: ids } as any,
      { relations: ["values"] },
      sharedContext
    );

    const attributesById = new Map<string, any>();
    for (const a of attributes as any[]) {
      attributesById.set(a.id, a);
    }

    // Collect all value IDs to remove and validate variant axis constraints
    const allAttrValueIds = new Set<string>();
    const attrIdsToRemove = new Set<string>();
    const productScopedToDelete: string[] = [];
    const variants = ((product as any).variants ?? []) as any[];

    for (const attrId of ids) {
      const attribute = attributesById.get(attrId);
      if (!attribute) continue;

      const valueIds = (attribute.values ?? []).map((v: any) => v.id);

      // If attribute is a variant axis, check for variants using its values
      if (attribute.is_variant_axis) {
        const valueIdSet = new Set(valueIds);
        const hasVariantsWithAttr = variants.some((variant) =>
          ((variant.attribute_values ?? []) as any[]).some((v: any) =>
            valueIdSet.has(v.id)
          )
        );

        if (hasVariantsWithAttr) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `Cannot remove variant axis attribute '${attribute.name}' because product variants are using it. Delete those variants first.`
          );
        }
      }

      attrIdsToRemove.add(attrId);
      for (const vid of valueIds) {
        allAttrValueIds.add(vid);
      }

      if (attribute.product_id === productId) {
        productScopedToDelete.push(attrId);
      }
    }

    // Build a single update payload to unlink everything at once
    const updatePayload: Record<string, any> = { id: productId };
    let needsUpdate = false;

    // Remove attributes from variant_attributes M2M
    const existingVariantAttrIds = (
      (product as any).variant_attributes ?? []
    ).map((a: any) => a.id);

    const filteredVariantAttrIds = existingVariantAttrIds.filter(
      (id: string) => !attrIdsToRemove.has(id)
    );
    if (filteredVariantAttrIds.length !== existingVariantAttrIds.length) {
      updatePayload.variant_attributes = filteredVariantAttrIds;
      needsUpdate = true;
    }

    // Remove attribute values from product's attribute_values M2M
    if (allAttrValueIds.size) {
      const existingValueIds = (
        (product as any).attribute_values ?? []
      ).map((v: any) => v.id);

      const filteredValueIds = existingValueIds.filter(
        (id: string) => !allAttrValueIds.has(id)
      );

      if (filteredValueIds.length !== existingValueIds.length) {
        updatePayload.attribute_values = filteredValueIds;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await super.updateProducts(updatePayload as any, sharedContext);
    }

    // Soft-delete product-scoped attributes
    if (productScopedToDelete.length) {
      await this.softDeleteProductAttributes(
        productScopedToDelete, {},
        sharedContext
      );
    }
  }

  // @ts-expect-error
  updateProductAttributes(
    id: string,
    data: UpdateProductAttributeDTO,
    sharedContext?: Context
  ): Promise<ProductAttributeDTO>;
  // @ts-expect-error
  updateProductAttributes(
    selector: Record<string, unknown>,
    data: UpdateProductAttributeDTO,
    sharedContext?: Context
  ): Promise<ProductAttributeDTO[]>;
  // @ts-expect-error
  updateProductAttributes(
    data: (UpdateProductAttributeDTO & { id: string })[],
    sharedContext?: Context
  ): Promise<ProductAttributeDTO[]>;

  @InjectTransactionManager()
  // @ts-expect-error
  async updateProductAttributes(
    idOrSelectorOrData:
      | string
      | Record<string, unknown>
      | (UpdateProductAttributeDTO & { id: string })[],
    dataOrContext?: UpdateProductAttributeDTO | Context,
    sharedContext?: Context
  ): Promise<ProductAttributeDTO | ProductAttributeDTO[]> {
    const isSelectorForm =
      typeof idOrSelectorOrData === "string" ||
      (!Array.isArray(idOrSelectorOrData) &&
        dataOrContext &&
        typeof dataOrContext === "object");

    if (isSelectorForm) {
      const update = dataOrContext as UpdateProductAttributeDTO;
      this.validateProductAttributeType_(update);

      // @ts-ignore
      return await super.updateProductAttributes(
        idOrSelectorOrData as any,
        update,
        sharedContext
      );
    }

    const data = idOrSelectorOrData as (UpdateProductAttributeDTO & {
      id: string;
    })[];

    for (const attr of data) {
      this.validateProductAttributeType_(attr);
    }

    // @ts-ignore
    return await super.updateProductAttributes(data, dataOrContext as Context);
  }

  @InjectTransactionManager()
  // @ts-ignore
  async createProductAttributeValues<TInput extends any | any[]>(
    data: TInput,
    sharedContext?: Context
  ): Promise<TInput extends any[] ? any[] : any> {
    const input = (Array.isArray(data) ? data : [data]).map((val: any) => {
      if (!val.handle && val.name) {
        val.handle = toHandle(val.name);
      }
      return val;
    });

    const result = await super.createProductAttributeValues(
      input,
      sharedContext
    );
    return (Array.isArray(data) ? result : result[0]) as any;
  }

  @InjectTransactionManager()
  async upsertProductAttributeValues(
    data: (UpsertProductAttributeValueDTO & { attribute_id?: string })[],
    sharedContext?: Context
  ): Promise<any[]> {
    const forCreate = data.filter(
      (v): v is CreateProductAttributeValueDTO & { attribute_id: string } =>
        !("id" in v) || !v.id
    );
    const forUpdate = data.filter(
      (v): v is UpdateProductAttributeValueDTO & { id: string } =>
        "id" in v && !!v.id
    );

    let created: any[] = [];
    let updated: any[] = [];

    if (forCreate.length) {
      created = await this.createProductAttributeValues(
        forCreate,
        sharedContext
      );
    }

    if (forUpdate.length) {
      updated = await super.updateProductAttributeValues(
        forUpdate,
        sharedContext
      );
    }

    return [...created, ...updated];
  }

  // @ts-expect-error
  createProductBrands(
    data: CreateProductBrandDTO[],
    sharedContext?: Context
  ): Promise<ProductBrandDTO[]>;
  // @ts-expect-error
  createProductBrands(
    data: CreateProductBrandDTO,
    sharedContext?: Context
  ): Promise<ProductBrandDTO>;

  @InjectTransactionManager()
  // @ts-expect-error
  async createProductBrands(
    data: any,
    sharedContext?: Context
  ): Promise<ProductBrandDTO | ProductBrandDTO[]> {
    const input = (Array.isArray(data) ? data : [data]).map((brand) => {
      if (!brand.handle && brand.name) {
        brand.handle = toHandle(brand.name);
      }

      return brand;
    });

    const result = await super.createProductBrands(input, sharedContext);
    return (Array.isArray(data) ? result : result[0]) as any;
  }

  // @ts-expect-error
  updateProductBrands(
    id: string,
    data: UpdateProductBrandDTO,
    sharedContext?: Context
  ): Promise<ProductBrandDTO>;
  // @ts-expect-error
  updateProductBrands(
    selector: Record<string, unknown>,
    data: UpdateProductBrandDTO,
    sharedContext?: Context
  ): Promise<ProductBrandDTO[]>;
  // @ts-expect-error
  updateProductBrands(
    data: (UpdateProductBrandDTO & { id: string })[],
    sharedContext?: Context
  ): Promise<ProductBrandDTO[]>;

  @InjectTransactionManager()
  // @ts-expect-error
  async updateProductBrands(
    idOrSelectorOrData:
      | string
      | Record<string, unknown>
      | (UpdateProductBrandDTO & { id: string })[],
    dataOrContext?: UpdateProductBrandDTO | Context,
    sharedContext?: Context
  ): Promise<ProductBrandDTO | ProductBrandDTO[]> {
    const isSelectorForm =
      typeof idOrSelectorOrData === "string" ||
      (!Array.isArray(idOrSelectorOrData) &&
        dataOrContext &&
        typeof dataOrContext === "object");

    if (isSelectorForm) {
      const update = dataOrContext as UpdateProductBrandDTO;

      if (!update.handle && update.name) {
        update.handle = toHandle(update.name);
      }

      // @ts-ignore
      return await super.updateProductBrands(
        idOrSelectorOrData as any,
        update,
        sharedContext
      );
    }

    const data = idOrSelectorOrData as (UpdateProductBrandDTO & {
      id: string;
    })[];

    const input = data.map((brand) => {
      if (!brand.handle && brand.name) {
        brand.handle = toHandle(brand.name);
      }

      return brand;
    });

    // @ts-ignore
    return await super.updateProductBrands(input, dataOrContext as Context);
  }

  // @ts-expect-error
  createProducts(
    data: CreateProductDTO[],
    sharedContext?: Context
  ): Promise<ProductDTO[]>;
  // @ts-expect-error
  createProducts(
    data: CreateProductDTO,
    sharedContext?: Context
  ): Promise<ProductDTO>;

  @InjectTransactionManager()
  // @ts-expect-error
  async createProducts(
    data: any,
    sharedContext?: Context
  ): Promise<ProductDTO | ProductDTO[]> {
    const input = Array.isArray(data) ? data : [data];

    await this.normalizeProductInput_(input, sharedContext);

    // Extract pending custom attribute IDs before passing to super
    const pendingCustomAttrs = new Map<number, string[]>();
    for (let i = 0; i < input.length; i++) {
      if (input[i].__pending_custom_attribute_ids) {
        pendingCustomAttrs.set(i, input[i].__pending_custom_attribute_ids);
        delete input[i].__pending_custom_attribute_ids;
      }
    }

    const result = await super.createProducts(input, sharedContext);
    const products = (Array.isArray(result) ? result : [result]) as any[];

    // Assign product_id to custom attributes now that products have IDs
    for (const [index, attrIds] of pendingCustomAttrs) {
      const productId = products[index].id;
      await this.updateProductAttributes(
        attrIds.map((id) => ({ id, product_id: productId })),
        sharedContext
      );
    }

    return (Array.isArray(data) ? products : products[0]) as any;
  }

  // @ts-expect-error
  updateProducts(
    id: string,
    data: UpdateProductDTO,
    sharedContext?: Context
  ): Promise<ProductDTO>;
  // @ts-expect-error
  updateProducts(
    selector: Record<string, unknown>,
    data: UpdateProductDTO,
    sharedContext?: Context
  ): Promise<ProductDTO[]>;
  // @ts-expect-error
  updateProducts(
    data: (UpdateProductDTO & { id: string })[],
    sharedContext?: Context
  ): Promise<ProductDTO[]>;

  @InjectTransactionManager()
  // @ts-expect-error
  async updateProducts(
    idOrSelectorOrData:
      | string
      | Record<string, unknown>
      | (UpdateProductDTO & { id: string })[],
    dataOrContext?: UpdateProductDTO | Context,
    sharedContext?: Context
  ): Promise<ProductDTO | ProductDTO[]> {
    const isSelectorForm =
      typeof idOrSelectorOrData === "string" ||
      (!Array.isArray(idOrSelectorOrData) &&
        dataOrContext &&
        typeof dataOrContext === "object");

    if (isSelectorForm) {
      const update = dataOrContext as UpdateProductDTO;

      // For selector/id form with attributes, expand to array form
      const hasAttributeInput =
        update.variant_attributes !== undefined ||
        update.product_attributes !== undefined ||
        (Array.isArray(update.variants) &&
          update.variants.some((v: any) => v?.attribute_values !== undefined));

      if (hasAttributeInput) {
        const wasIdForm = typeof idOrSelectorOrData === "string";
        let productIds: string[];
        if (wasIdForm) {
          productIds = [idOrSelectorOrData as string];
        } else {
          const products = await this.listProducts(
            idOrSelectorOrData as any,
            { select: ["id"] as any },
            sharedContext
          );
          productIds = (products as any[]).map((p) => p.id);
        }

        if (!productIds.length) {
          return wasIdForm ? (undefined as any) : [];
        }

        const batch = productIds.map((id) => ({
          id,
          ...update,
        })) as (UpdateProductDTO & { id: string })[];

        await this.normalizeProductInput_(batch, sharedContext);

        // @ts-ignore
        const results = await super.updateProducts(batch, sharedContext);
        const arr = Array.isArray(results) ? results : [results];
        return (wasIdForm ? arr[0] : arr) as any;
      }

      // Simple path: normalize in place
      await this.normalizeProductInput_([update], sharedContext);

      // @ts-ignore
      return await super.updateProducts(
        idOrSelectorOrData as any,
        update,
        sharedContext
      );
    }

    const input = idOrSelectorOrData as (UpdateProductDTO & { id: string })[];

    await this.normalizeProductInput_(input, sharedContext);

    // @ts-ignore
    return await super.updateProducts(input, dataOrContext as Context);
  }

  // @ts-expect-error
  createProductVariants(
    data: CreateProductVariantDTO[],
    sharedContext?: Context
  ): Promise<ProductVariantDTO[]>;
  // @ts-expect-error
  createProductVariants(
    data: CreateProductVariantDTO,
    sharedContext?: Context
  ): Promise<ProductVariantDTO>;

  @InjectTransactionManager()
  // @ts-expect-error
  async createProductVariants(
    data: CreateProductVariantDTO | CreateProductVariantDTO[],
    sharedContext?: Context
  ): Promise<ProductVariantDTO | ProductVariantDTO[]> {
    const input = Array.isArray(data) ? data : [data];

    await this.normalizeVariantAttributeValues_(input, sharedContext);

    // @ts-ignore
    const result = await super.createProductVariants(input, sharedContext);
    const variants = (
      Array.isArray(result) ? result : [result]
    ) as ProductVariantDTO[];

    return Array.isArray(data) ? variants : variants[0];
  }

  upsertProductVariants(
    data: UpsertProductVariantDTO[],
    sharedContext?: Context
  ): Promise<ProductVariantDTO[]>;
  upsertProductVariants(
    data: UpsertProductVariantDTO,
    sharedContext?: Context
  ): Promise<ProductVariantDTO>;

  @InjectTransactionManager()
  async upsertProductVariants(
    data: UpsertProductVariantDTO[] | UpsertProductVariantDTO,
    sharedContext?: Context
  ): Promise<ProductVariantDTO[] | ProductVariantDTO> {
    const input = Array.isArray(data) ? data : [data];
    const forUpdate = input.filter(
      (v): v is UpsertProductVariantDTO & { id: string } => !!v.id
    );
    const forCreate = input.filter(
      (v): v is CreateProductVariantDTO => !v.id
    );

    let created: ProductVariantDTO[] = [];
    let updated: ProductVariantDTO[] = [];

    if (forCreate.length) {
      const result = await this.createProductVariants(forCreate, sharedContext);
      created = (Array.isArray(result) ? result : [result]) as ProductVariantDTO[];
    }
    if (forUpdate.length) {
      const result = await this.updateProductVariants(forUpdate, sharedContext);
      updated = (Array.isArray(result) ? result : [result]) as ProductVariantDTO[];
    }

    const all = [...created, ...updated];
    return Array.isArray(data) ? all : all[0];
  }

  // @ts-expect-error
  updateProductVariants(
    id: string,
    data: UpdateProductVariantDTO,
    sharedContext?: Context
  ): Promise<ProductVariantDTO>;
  // @ts-expect-error
  updateProductVariants(
    selector: Record<string, unknown>,
    data: UpdateProductVariantDTO,
    sharedContext?: Context
  ): Promise<ProductVariantDTO[]>;
  // @ts-expect-error
  updateProductVariants(
    data: (UpdateProductVariantDTO & { id: string })[],
    sharedContext?: Context
  ): Promise<ProductVariantDTO[]>;

  @InjectTransactionManager()
  // @ts-expect-error
  async updateProductVariants(
    idOrSelectorOrData:
      | string
      | Record<string, unknown>
      | (UpdateProductVariantDTO & { id: string })[],
    dataOrContext?: UpdateProductVariantDTO | Context,
    sharedContext?: Context
  ): Promise<ProductVariantDTO | ProductVariantDTO[]> {
    const isSelectorForm =
      typeof idOrSelectorOrData === "string" ||
      (!Array.isArray(idOrSelectorOrData) &&
        dataOrContext &&
        typeof dataOrContext === "object");

    if (isSelectorForm) {
      const update = dataOrContext as UpdateProductVariantDTO;

      // Map-style attribute_values must resolve per variant (each may have a
      // different parent product), so expand selector/id form to array form.
      const hasMapAttrValues =
        update?.attribute_values !== undefined &&
        !Array.isArray(update.attribute_values) &&
        typeof update.attribute_values === "object";

      if (hasMapAttrValues) {
        const wasIdForm = typeof idOrSelectorOrData === "string";
        let variantIds: string[];

        if (wasIdForm) {
          variantIds = [idOrSelectorOrData as string];
        } else {
          const variants = await super.listProductVariants(
            idOrSelectorOrData as any,
            { select: ["id"] as any },
            sharedContext
          );
          variantIds = (variants as any[]).map((v) => v.id);
        }

        if (!variantIds.length) {
          return wasIdForm ? (undefined as any) : [];
        }

        const batch = variantIds.map((id) => ({
          id,
          ...update,
        })) as (UpdateProductVariantDTO & { id: string })[];

        await this.normalizeVariantAttributeValues_(batch, sharedContext);

        // @ts-ignore
        const results = await super.updateProductVariants(batch, sharedContext);
        const arr = Array.isArray(results) ? results : [results];
        return (wasIdForm ? arr[0] : arr) as any;
      }

      // @ts-ignore
      return await super.updateProductVariants(
        idOrSelectorOrData as string | Record<string, unknown>,
        update,
        sharedContext
      );
    }

    const data = idOrSelectorOrData as (UpdateProductVariantDTO & {
      id: string;
    })[];

    await this.normalizeVariantAttributeValues_(data, sharedContext);

    // @ts-ignore
    return await super.updateProductVariants(data, dataOrContext as Context);
  }

  // @ts-expect-error
  async createProductCategories(
    data: any | any[],
    sharedContext?: Context
  ) {
    const input = (Array.isArray(data) ? data : [data]).map((category: any) => {
      category.handle ??= kebabCase(category.name);
      return category;
    });

    const categories = await this.productCategoryService_.create(
      input,
      sharedContext
    );

    return Array.isArray(data) ? categories : categories[0];
  }

  // @ts-expect-error
  async updateProductCategories(
    data: any,
    sharedContext?: Context
  ) {
    let normalizedInput: UpdateCategoryInput[];

    if (typeof data === "object" && !Array.isArray(data) && data.id) {
      normalizedInput = [data as UpdateCategoryInput];
    } else if (Array.isArray(data)) {
      normalizedInput = data;
    } else {
      normalizedInput = [data];
    }

    const categories = await this.productCategoryService_.update(
      normalizedInput,
      sharedContext
    );

    return Array.isArray(data) ? categories : categories[0];
  }

  // @ts-expect-error
  async retrieveProductCategory(
    id: string,
    config?: FindConfig<any>,
    sharedContext?: Context
  ) {
    return await this.productCategoryService_.retrieve(
      id,
      config,
      sharedContext
    );
  }

  // @ts-expect-error
  async listProductCategories(
    filters?: Record<string, any>,
    config?: FindConfig<any>,
    sharedContext?: Context
  ) {
    return await this.productCategoryService_.list(
      filters,
      config,
      sharedContext
    );
  }

  // @ts-expect-error
  async listAndCountProductCategories(
    filters?: Record<string, any>,
    config?: FindConfig<any>,
    sharedContext?: Context
  ) {
    return await this.productCategoryService_.listAndCount(
      filters,
      config,
      sharedContext
    );
  }

  // @ts-expect-error
  async deleteProductCategories(
    ids: string | string[],
    sharedContext?: Context
  ) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    return await this.productCategoryService_.delete(idsArray, sharedContext);
  }

  // @ts-expect-error
  async softDeleteProductCategories(
    ids: string | string[],
    sharedContext?: Context
  ) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    return await this.productCategoryService_.softDelete(
      idsArray,
      sharedContext
    );
  }

  // @ts-expect-error
  async restoreProductCategories(
    ids: string | string[],
    sharedContext?: Context
  ) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    return await this.productCategoryService_.restore(
      idsArray,
      sharedContext
    );
  }

  // --- ProductChange lifecycle methods ---

  /**
   * Confirms one or more pending product changes and applies their actions
   * to the underlying products. Mirrors Medusa's `confirmOrderChange`:
   * validation + status update + action application happen atomically.
   *
   * `internal_note` is operator-only context. `external_note` is the
   * vendor-visible message (e.g. rejection / changes-required reason)
   * that is also forwarded to notification subscribers.
   */
  @InjectTransactionManager()
  async confirmProductChange(
    data:
      | {
          id: string
          confirmed_by?: string
          internal_note?: string
          external_note?: string
        }
      | {
          id: string
          confirmed_by?: string
          internal_note?: string
          external_note?: string
        }[],
    sharedContext?: Context
  ) {
    const items = Array.isArray(data) ? data : [data];
    const ids = items.map((i) => i.id);

    const changes = await this.listProductChanges(
      { id: ids },
      {
        select: ["id", "status", "actions"] as any,
        relations: ["actions"],
        order: { actions: { ordering: "ASC" } } as any,
      },
      sharedContext
    );

    if (changes.length !== ids.length) {
      const found = new Set(changes.map((c: any) => c.id));
      const missing = ids.filter((id) => !found.has(id));
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product change(s) not found: ${missing.join(", ")}`
      );
    }

    for (const change of changes as any[]) {
      if (change.status !== ProductChangeStatus.PENDING) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot confirm product change '${change.id}' with status '${change.status}'. Only pending changes can be confirmed.`
        );
      }
    }

    await this.updateProductChanges(
      items.map((item) => {
        const update: Record<string, unknown> = {
          id: item.id,
          status: ProductChangeStatus.CONFIRMED,
          confirmed_by: item.confirmed_by,
          confirmed_at: new Date(),
        };
        if (item.internal_note !== undefined) {
          update.internal_note = item.internal_note;
        }
        if (item.external_note !== undefined) {
          update.external_note = item.external_note;
        }
        return update;
      }) as any,
      sharedContext
    );

    const allActions = (changes as any[]).flatMap((c) => c.actions ?? []);
    await this.applyProductChangeActions_(allActions, sharedContext);
  }

  /**
   * Applies pending change actions to their products. Public entrypoint
   * for callers that want to apply without confirming (e.g. previewing
   * effects). Internally delegates to the same routine `confirmProductChange`
   * uses.
   */
  @InjectTransactionManager()
  async applyProductChangeActions(
    actions: Array<{
      id: string;
      product_id: string;
      action: string;
      details?: Record<string, unknown> | null;
      applied?: boolean;
    }>,
    sharedContext?: Context
  ): Promise<void> {
    await this.applyProductChangeActions_(actions, sharedContext);
  }

  protected async applyProductChangeActions_(
    actions: Array<{
      id: string;
      product_id: string;
      action: string;
      details?: Record<string, unknown> | null;
      applied?: boolean;
    }>,
    sharedContext?: Context
  ): Promise<void> {
    const pending = (actions ?? []).filter((a) => !a.applied);

    if (!pending.length) return;

    // Bucket actions per type so each kind dispatches in one DB round.
    const productUpdatesByProductId = new Map<
      string,
      Record<string, unknown>
    >();
    const variantsToCreate: Array<
      CreateProductVariantDTO & { product_id: string }
    > = [];
    const variantUpdates: Array<UpdateProductVariantDTO & { id: string }> = [];
    const variantsToDelete: string[] = [];
    const attributeAddsByProductId = new Map<
      string,
      Array<{
        attribute_id: string;
        attribute_value_ids?: string[];
        values?: string[];
      }>
    >();
    const attributeRemovesByProductId = new Map<string, string[]>();
    const productsToDelete = new Set<string>();

    for (const action of pending) {
      const details = (action.details ?? {}) as Record<string, unknown>;

      switch (action.action) {
        case ProductChangeActionType.STATUS_CHANGE: {
          const status = (details as { status?: string }).status;
          if (status === undefined) break;
          const update =
            productUpdatesByProductId.get(action.product_id) ??
            ({ id: action.product_id } as Record<string, unknown>);
          update.status = status;
          productUpdatesByProductId.set(action.product_id, update);
          break;
        }
        case ProductChangeActionType.UPDATE: {
          const { field, value } = details as {
            field?: string;
            value?: unknown;
          };
          if (!field) break;
          const update =
            productUpdatesByProductId.get(action.product_id) ??
            ({ id: action.product_id } as Record<string, unknown>);
          update[field] = value;
          productUpdatesByProductId.set(action.product_id, update);
          break;
        }
        case ProductChangeActionType.VARIANT_ADD: {
          const variant = (details as { variant?: CreateProductVariantDTO })
            .variant;
          if (!variant) break;
          variantsToCreate.push({
            ...variant,
            product_id: action.product_id,
          });
          break;
        }
        case ProductChangeActionType.VARIANT_UPDATE: {
          const { variant_id, fields } = details as {
            variant_id?: string;
            fields?: UpdateProductVariantDTO;
          };
          if (!variant_id || !fields || !Object.keys(fields).length) break;
          variantUpdates.push({
            id: variant_id,
            ...fields,
          } as UpdateProductVariantDTO & { id: string });
          break;
        }
        case ProductChangeActionType.VARIANT_REMOVE: {
          const { variant_id } = details as { variant_id?: string };
          if (variant_id) variantsToDelete.push(variant_id);
          break;
        }
        case ProductChangeActionType.ATTRIBUTE_ADD: {
          const { attribute_id, attribute_value_ids, values } = details as {
            attribute_id?: string;
            attribute_value_ids?: string[];
            values?: string[];
          };
          if (!attribute_id) break;
          const list =
            attributeAddsByProductId.get(action.product_id) ?? [];
          list.push({ attribute_id, attribute_value_ids, values });
          attributeAddsByProductId.set(action.product_id, list);
          break;
        }
        case ProductChangeActionType.ATTRIBUTE_REMOVE: {
          const { attribute_id } = details as { attribute_id?: string };
          if (!attribute_id) break;
          const list =
            attributeRemovesByProductId.get(action.product_id) ?? [];
          list.push(attribute_id);
          attributeRemovesByProductId.set(action.product_id, list);
          break;
        }
        case ProductChangeActionType.PRODUCT_DELETE: {
          productsToDelete.add(action.product_id);
          break;
        }
      }
    }

    // Top-level Product field + status updates — one call per product.
    const productUpdates = Array.from(
      productUpdatesByProductId.values()
    ).filter((u) => Object.keys(u).length > 1);
    if (productUpdates.length) {
      await this.updateProducts(productUpdates as any, sharedContext);
    }

    // Variant deletes first — frees up SKU/title uniqueness for adds in the
    // same change. Updates last so they see a stable variant set.
    if (variantsToDelete.length) {
      await this.deleteProductVariants(variantsToDelete, sharedContext);
    }
    if (variantsToCreate.length) {
      await this.createProductVariants(variantsToCreate, sharedContext);
    }
    if (variantUpdates.length) {
      await this.updateProductVariants(variantUpdates, sharedContext);
    }

    // Attribute removes before adds so the same attribute can be re-linked
    // with a different value set in a single change.
    for (const [productId, attrIds] of attributeRemovesByProductId) {
      await this.removeAttributeFromProduct(productId, attrIds, sharedContext);
    }
    for (const [productId, items] of attributeAddsByProductId) {
      await this.addAttributesToProduct(productId, items, sharedContext);
    }

    // Product deletes happen last — any audit-trail updates above still
    // write through before the product is gone. Soft-delete preserves the
    // ProductChange record (it stays linked to the now-deleted product so
    // the change history remains queryable).
    if (productsToDelete.size) {
      await this.softDeleteProducts(
        Array.from(productsToDelete),
        {},
        sharedContext
      );
    }

    await this.updateProductChangeActions(
      pending.map((a) => ({ id: a.id, applied: true })),
      sharedContext
    );
  }

  @InjectTransactionManager()
  async declineProductChange(
    id: string,
    data: {
      declined_by?: string;
      declined_reason?: string;
    },
    sharedContext?: Context
  ) {
    const change = await this.retrieveProductChange(id, {}, sharedContext);

    if (change.status !== ProductChangeStatus.PENDING) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot decline product change with status '${change.status}'. Only pending changes can be declined.`
      );
    }

    await this.updateProductChanges(
      {
        id,
        status: ProductChangeStatus.DECLINED,
        declined_by: data.declined_by,
        declined_at: new Date(),
        declined_reason: data.declined_reason,
      },
      sharedContext
    );
  }

  @InjectTransactionManager()
  async cancelProductChange(
    id: string,
    data: { canceled_by?: string; internal_note?: string },
    sharedContext?: Context
  ) {
    const change = await this.retrieveProductChange(id, {}, sharedContext);

    if (change.status !== ProductChangeStatus.PENDING) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot cancel product change with status '${change.status}'. Only pending changes can be canceled.`
      );
    }

    const update: Record<string, unknown> = {
      id,
      status: ProductChangeStatus.CANCELED,
      canceled_by: data.canceled_by,
      canceled_at: new Date(),
    };
    if (data.internal_note !== undefined) {
      update.internal_note = data.internal_note;
    }

    await this.updateProductChanges(update as any, sharedContext);
  }

  addProductAction(
    data: AddProductActionInput[],
    sharedContext?: Context
  ): Promise<ProductChangeActionDTO[]>;
  addProductAction(
    data: AddProductActionInput,
    sharedContext?: Context
  ): Promise<ProductChangeActionDTO>;

  @InjectTransactionManager()
  async addProductAction(
    data: AddProductActionInput | AddProductActionInput[],
    sharedContext?: Context
  ): Promise<ProductChangeActionDTO | ProductChangeActionDTO[]> {
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      if (item.applied) continue;

      const change = await this.retrieveProductChange(
        item.product_change_id,
        {},
        sharedContext
      );

      if (change.status !== ProductChangeStatus.PENDING) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot add action to product change with status '${change.status}'. Only pending changes accept actions.`
        );
      }
    }

    const result = await this.createProductChangeActions(
      items.map((item) => ({
        product_change_id: item.product_change_id,
        product_id: item.product_id,
        action: item.action,
        details: item.details ?? {},
        internal_note: item.internal_note,
        applied: item.applied,
      })),
      sharedContext
    );

    return (Array.isArray(data) ? result : result[0]) as any
  }
}

export default ProductModuleService;
