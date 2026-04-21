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

    // Variant attributes normalization (inline creation + reference resolution)
    const hasVariantAttrInput = products.some(
      (p) =>
        p.variant_attributes !== undefined ||
        (Array.isArray(p.variants) &&
          p.variants.some((v: any) => v?.attribute_values !== undefined))
    );

    if (hasVariantAttrInput) {
      await this.normalizeVariantAttributes_(products, sharedContext);
    }

    // Final: convert variant_attributes and variant.attribute_values → plain IDs
    for (const product of products) {
      if (product.variant_attributes?.length) {
        product.variant_attributes = product.variant_attributes.map(
          (a: { id: string } | string) => (typeof a === "string" ? a : a.id)
        );
      }
      if (Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (variant?.attribute_values?.length) {
            variant.attribute_values = variant.attribute_values.map(
              (v: { id: string } | string) =>
                typeof v === "string" ? v : v.id
            );
          }
        }
      }
    }

    return products;
  }

  private async normalizeVariantAttributes_(
    products: any[],
    sharedContext?: Context
  ): Promise<void> {
    const isInlineEntry = (entry: any): boolean =>
      typeof entry?.name === "string" && typeof entry?.type === "string";

    // Collect handles to resolve
    const handles = new Set<string>();
    for (const product of products) {
      for (const entry of product.variant_attributes ?? []) {
        if (!isInlineEntry(entry) && !entry.id && entry.handle) {
          handles.add(entry.handle);
        }
      }
    }

    // Batch-load attributes by handle
    const attrsByHandle = new Map<string, any>();
    if (handles.size) {
      const attrs = await this.listProductAttributes(
        { handle: Array.from(handles) } as any,
        { relations: ["values"] },
        sharedContext
      );
      for (const a of attrs as any[]) {
        if (a.handle) attrsByHandle.set(a.handle, a);
      }
    }

    // Collect inline entries to batch-create
    type Slot = { pi: number; ei: number; payload: CreateProductAttributeDTO };
    const slots: Slot[] = [];

    for (let pi = 0; pi < products.length; pi++) {
      const entries = products[pi].variant_attributes ?? [];
      for (let ei = 0; ei < entries.length; ei++) {
        const entry = entries[ei];
        if (!isInlineEntry(entry)) continue;

        slots.push({
          pi,
          ei,
          payload: {
            ...entry,
            is_global: false,
            is_variant_axis: true,
            created_by: entry.created_by ?? products[pi].created_by ?? null,
          },
        });
      }
    }

    const createdBySlot = new Map<string, any>();
    if (slots.length) {
      const created = (await this.createProductAttributes(
        slots.map((s) => s.payload),
        sharedContext
      )) as any;
      const arr = Array.isArray(created) ? created : [created];
      for (let i = 0; i < slots.length; i++) {
        createdBySlot.set(`${slots[i].pi}:${slots[i].ei}`, arr[i]);
      }
    }

    // Load all resolved attribute IDs for value lookup
    const allAttrIds = new Set<string>();
    for (let pi = 0; pi < products.length; pi++) {
      const entries = products[pi].variant_attributes ?? [];
      for (let ei = 0; ei < entries.length; ei++) {
        const entry = entries[ei];
        if (isInlineEntry(entry)) {
          const created = createdBySlot.get(`${pi}:${ei}`);
          if (created) allAttrIds.add(created.id);
        } else if (entry.id) {
          allAttrIds.add(entry.id);
        } else if (entry.handle) {
          const resolved = attrsByHandle.get(entry.handle);
          if (resolved) allAttrIds.add(resolved.id);
        }
      }
    }

    // Batch-load all attributes with values for variant.attribute_values resolution
    const attrsById = new Map<string, any>();
    if (allAttrIds.size) {
      const attrs = await this.listProductAttributes(
        { id: Array.from(allAttrIds) } as any,
        { relations: ["values"] },
        sharedContext
      );
      for (const a of attrs as any[]) {
        attrsById.set(a.id, a);
      }
    }

    // Resolve per product
    for (let pi = 0; pi < products.length; pi++) {
      const product = products[pi];
      const entries = product.variant_attributes as any[] | undefined;
      if (!entries) continue;

      const resolvedIds: string[] = [];
      const byKey = new Map<string, Map<string, string>>();

      for (let ei = 0; ei < entries.length; ei++) {
        const entry = entries[ei];
        let attr: any;

        if (isInlineEntry(entry)) {
          attr = createdBySlot.get(`${pi}:${ei}`);
        } else if (entry.id) {
          attr = attrsById.get(entry.id);
        } else if (entry.handle) {
          attr = attrsByHandle.get(entry.handle);
        }

        if (!attr) continue;

        resolvedIds.push(attr.id);

        // Build value lookup: name/handle → id
        const valueByKey = new Map<string, string>();
        for (const v of attr.values ?? []) {
          if (v.name) valueByKey.set(v.name, v.id);
          if (v.handle) valueByKey.set(v.handle, v.id);
        }
        byKey.set(attr.id, valueByKey);
        if (attr.handle) byKey.set(attr.handle, valueByKey);
        if (attr.name) byKey.set(attr.name, valueByKey);
      }

      product.variant_attributes = resolvedIds.map((id) => ({ id }));

      // Resolve variant.attribute_values from { attrKey: "valueName" } → [{ id }]
      if (Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (variant?.attribute_values === undefined) continue;
          const attrVals = variant.attribute_values;
          if (Array.isArray(attrVals)) continue;

          const resolved: { id: string }[] = [];
          for (const [key, raw] of Object.entries(
            attrVals as Record<string, string | string[]>
          )) {
            const valueMap = byKey.get(key);
            if (!valueMap) continue;

            const vals = Array.isArray(raw) ? raw : [raw];
            for (const v of vals) {
              const id = valueMap.get(v);
              if (id) resolved.push({ id });
            }
          }
          variant.attribute_values = resolved;
        }
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

      if (attr.is_global !== false && !attr.handle && attr.name) {
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

      // For selector/id form with variant attributes, expand to array form
      const hasVariantAttrInput =
        update.variant_attributes !== undefined ||
        (Array.isArray(update.variants) &&
          update.variants.some((v: any) => v?.attribute_values !== undefined));

      if (hasVariantAttrInput) {
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
