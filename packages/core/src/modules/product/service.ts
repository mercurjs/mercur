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
  ProductRejectionReason,
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
  ProductRejectionReason,
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
        ProductRejectionReason,
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

    return product;
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
      AttributeType.SINGLE_SELECT,
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
        `Attribute '${attr.name ?? attr.id ?? "(unnamed)"}' (type=${attr.type}) cannot be a variant axis. Only single_select and multi_select attributes may drive variants.`
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
        p.attribute_values !== undefined ||
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
   * **`attribute_values`** (product-level) — `Record<string, string | string[]>`
   *   keyed by attribute name/handle, resolved to ProductAttributeValue IDs.
   *   Used for non-variant descriptive attributes.
   *
   * **`variant.attribute_values`** — same format, resolved to IDs per variant.
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
    }

    // Batch-load referenced global attributes with their values
    const attrsById = new Map<string, any>();
    if (attrIds.size) {
      const attrs = await this.listProductAttributes(
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
            this.addAttrToLookup_(customAttr as any, valueLookup);
          }
        }

        // Set M2M variant_attributes as IDs
        product.variant_attributes = variantAttributeIds;
      }

      // --- Resolve product-level attribute_values ---
      if (product.attribute_values && !Array.isArray(product.attribute_values)) {
        // May reference attributes not yet in the lookup — load them
        await this.ensureAttrLookup_(
          product.attribute_values as Record<string, unknown>,
          valueLookup,
          attrsById,
          sharedContext
        );

        product.attribute_values = this.resolveValueMap_(
          product.attribute_values as Record<string, string | string[]>,
          valueLookup
        );
      }

      // --- Resolve variant.attribute_values ---
      if (Array.isArray(product.variants)) {
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
   * Ensures all attribute keys in a value map are present in the lookup.
   * Loads missing attributes by name/handle if needed.
   */
  private async ensureAttrLookup_(
    valueMap: Record<string, unknown>,
    lookup: Map<string, Map<string, string>>,
    attrsById: Map<string, any>,
    sharedContext?: Context
  ): Promise<void> {
    const missingKeys: string[] = [];
    for (const key of Object.keys(valueMap)) {
      if (!lookup.has(key)) missingKeys.push(key);
    }

    if (!missingKeys.length) return;

    // Try loading by handle or name
    const attrs = await this.listProductAttributes(
      {
        $or: [
          { handle: missingKeys },
          { name: missingKeys },
        ],
      } as any,
      { relations: ["values"] },
      sharedContext
    );

    for (const a of attrs as any[]) {
      if (!attrsById.has(a.id)) attrsById.set(a.id, a);
      this.addAttrToLookup_(a, lookup);
    }
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
    return (Array.isArray(data) ? result : result[0]) as any;
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

    const result = await super.createProducts(input, sharedContext);
    return (Array.isArray(data) ? result : result[0]) as any;
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
        update.attribute_values !== undefined ||
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
      const result = await super.createProductVariants(forCreate, sharedContext);
      created = (Array.isArray(result) ? result : [result]) as unknown as ProductVariantDTO[];
    }
    if (forUpdate.length) {
      // @ts-ignore
      const result = await super.updateProductVariants(forUpdate, sharedContext);
      updated = (Array.isArray(result) ? result : [result]) as unknown as ProductVariantDTO[];
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
      // @ts-ignore
      return await super.updateProductVariants(
        idOrSelectorOrData as string | Record<string, unknown>,
        dataOrContext as UpdateProductVariantDTO,
        sharedContext
      );
    }

    // @ts-ignore
    return await super.updateProductVariants(
      idOrSelectorOrData,
      dataOrContext as Context
    );
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

  @InjectTransactionManager()
  async confirmProductChange(
    data:
      | { id: string; confirmed_by?: string }
      | { id: string; confirmed_by?: string }[],
    sharedContext?: Context
  ) {
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      const change = await this.retrieveProductChange(
        item.id,
        {},
        sharedContext
      );

      if (change.status !== ProductChangeStatus.PENDING) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot confirm product change with status '${change.status}'. Only pending changes can be confirmed.`
        );
      }
    }

    await this.updateProductChanges(
      items.map((item) => ({
        id: item.id,
        status: ProductChangeStatus.CONFIRMED,
        confirmed_by: item.confirmed_by,
        confirmed_at: new Date(),
      })),
      sharedContext
    );
  }

  @InjectTransactionManager()
  async declineProductChange(
    id: string,
    data: {
      declined_by?: string;
      declined_reason?: string;
      rejection_reasons?: { id: string }[];
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
        rejection_reasons: data.rejection_reasons?.map((r) => r.id) as any,
      },
      sharedContext
    );
  }

  @InjectTransactionManager()
  async cancelProductChange(
    id: string,
    data: { canceled_by?: string },
    sharedContext?: Context
  ) {
    const change = await this.retrieveProductChange(id, {}, sharedContext);

    if (change.status !== ProductChangeStatus.PENDING) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot cancel product change with status '${change.status}'. Only pending changes can be canceled.`
      );
    }

    await this.updateProductChanges(
      {
        id,
        status: ProductChangeStatus.CANCELED,
        canceled_by: data.canceled_by,
        canceled_at: new Date(),
      },
      sharedContext
    );
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
      })),
      sharedContext
    );

    return (Array.isArray(data) ? result : result[0]) as any
  }
}

export default ProductModuleService;
