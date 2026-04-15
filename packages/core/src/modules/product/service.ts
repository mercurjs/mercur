import { Context, FindConfig } from "@medusajs/framework/types";
import {
  InjectTransactionManager,
  kebabCase,
  MedusaError,
  MedusaService,
  isValidHandle,
  toHandle,
} from "@medusajs/framework/utils";
import {
  AttributeType,
  CreateProductAttributeDTO,
  CreateProductAttributeValueDTO,
  CreateProductDTO,
  ProductAttributeDTO,
  ProductChangeActionDTO,
  ProductChangeStatus,
  ProductDTO,
  UpdateProductAttributeDTO,
  UpdateProductDTO,
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

  private validateProductHandle(handle?: string): void {
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

  private hasVariantAttributeInput_(product: any): boolean {
    if (product.variant_attributes !== undefined) return true;
    if (Array.isArray(product.variants)) {
      for (const v of product.variants) {
        if (v && (v as any).attribute_values !== undefined) return true;
      }
    }
    return false;
  }

  private resolveVariantAttributeValues_(
    variant: any,
    byKey: Map<string, { attrId: string; valueByKey: Map<string, string> }>
  ): { id: string }[] {
    const attrVals = variant.attribute_values as
      | Record<string, string | string[]>
      | { id: string }[]
      | undefined;

    if (!attrVals || Array.isArray(attrVals)) {
      return (attrVals as { id: string }[] | undefined) ?? [];
    }

    const result: { id: string }[] = [];
    for (const [key, raw] of Object.entries(attrVals)) {
      const entry = byKey.get(key);
      if (!entry) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Attribute '${key}' is not among the product's variant_attributes`
        );
      }
      const vals = Array.isArray(raw) ? raw : [raw];
      for (const v of vals) {
        const id = entry.valueByKey.get(v);
        if (!id) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Value '${v}' does not exist for attribute '${key}'`
          );
        }
        result.push({ id });
      }
    }
    return result;
  }

  private async normalizeVariantAttributes_(
    products: any[],
    sharedContext?: Context
  ): Promise<any[]> {
    // Preload existing product.variant_attributes (with values) for update path
    const productIds = products
      .map((p) => p.id)
      .filter((id): id is string => typeof id === "string");

    const existingByProductId = new Map<string, any[]>();
    if (productIds.length) {
      const existingProducts = await this.listProducts(
        { id: productIds },
        {
          relations: ["variant_attributes", "variant_attributes.values"],
          take: productIds.length,
        },
        sharedContext
      );
      for (const p of existingProducts as any[]) {
        existingByProductId.set(p.id, p.variant_attributes ?? []);
      }
    }

    // Gather ids/handles to batch-load referenced attributes
    const refIds = new Set<string>();
    const refHandles = new Set<string>();
    const isInlineEntry = (entry: any): boolean =>
      typeof entry?.name === "string" && typeof entry?.type === "string";

    for (const product of products) {
      const entries = product.variant_attributes as any[] | undefined;
      if (!entries) continue;
      for (const entry of entries) {
        if (isInlineEntry(entry)) continue;
        if (typeof entry.id === "string") refIds.add(entry.id);
        else if (typeof entry.handle === "string") refHandles.add(entry.handle);
      }
    }

    const refAttrsById = new Map<string, any>();
    const refAttrsByHandle = new Map<string, any>();
    if (refIds.size) {
      const byIds = await this.listProductAttributes(
        { id: Array.from(refIds) } as any,
        { relations: ["values"] },
        sharedContext
      );
      for (const a of byIds as any[]) {
        refAttrsById.set(a.id, a);
        if (a.handle) refAttrsByHandle.set(a.handle, a);
      }
    }
    if (refHandles.size) {
      const byHandles = await this.listProductAttributes(
        { handle: Array.from(refHandles) } as any,
        { relations: ["values"] },
        sharedContext
      );
      for (const a of byHandles as any[]) {
        if (!refAttrsById.has(a.id)) {
          refAttrsById.set(a.id, a);
          if (a.handle) refAttrsByHandle.set(a.handle, a);
        }
      }
    }

    // Collect inline-create payloads across all products for a batched create
    type InlineSlot = {
      productIdx: number;
      entryIdx: number;
      payload: CreateProductAttributeDTO;
    };
    const inlineSlots: InlineSlot[] = [];

    for (let pi = 0; pi < products.length; pi++) {
      const product = products[pi];
      const entries = product.variant_attributes as any[] | undefined;
      if (!entries) continue;

      const existingList = product.id
        ? existingByProductId.get(product.id) ?? []
        : [];

      for (let ei = 0; ei < entries.length; ei++) {
        const entry = entries[ei];
        if (!isInlineEntry(entry)) continue;

        // On update path, an inline payload may match an attribute already
        // linked to the product — treat as upsert (reference + merge values).
        const match = existingList.find(
          (a: any) =>
            (entry.id && a.id === entry.id) ||
            (entry.handle && a.handle === entry.handle) ||
            (entry.name && a.name === entry.name)
        );
        if (match) continue;

        if (entry.is_variant_axis === false) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Inline variant_attribute '${entry.name}' must have is_variant_axis=true`
          );
        }
        if (!Array.isArray(entry.values) || entry.values.length === 0) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Inline variant_attribute '${entry.name}' must include at least one value`
          );
        }

        this.validateProductAttributeType_({
          name: entry.name,
          type: entry.type,
          is_variant_axis: true,
          is_filterable: entry.is_filterable,
        });

        inlineSlots.push({
          productIdx: pi,
          entryIdx: ei,
          payload: {
            ...entry,
            is_global: false,
            is_variant_axis: true,
            created_by: entry.created_by ?? product.created_by ?? null,
          },
        });
      }
    }

    let createdInline: any[] = [];
    if (inlineSlots.length) {
      const created = (await this.createProductAttributes(
        inlineSlots.map((s) => s.payload),
        sharedContext
      )) as any;
      createdInline = Array.isArray(created) ? created : [created];
    }
    const createdBySlot = new Map<string, any>();
    for (let i = 0; i < inlineSlots.length; i++) {
      const s = inlineSlots[i];
      createdBySlot.set(`${s.productIdx}:${s.entryIdx}`, createdInline[i]);
    }

    // Validate references (must be global unless already linked to the product)
    for (let pi = 0; pi < products.length; pi++) {
      const product = products[pi];
      const entries = product.variant_attributes as any[] | undefined;
      if (!entries) continue;
      const existingList = product.id
        ? existingByProductId.get(product.id) ?? []
        : [];

      for (const entry of entries) {
        if (isInlineEntry(entry)) continue;
        const alreadyLinked =
          (entry.id && existingList.some((a: any) => a.id === entry.id)) ||
          (entry.handle &&
            existingList.some((a: any) => a.handle === entry.handle));
        if (alreadyLinked) continue;

        const attr = entry.id
          ? refAttrsById.get(entry.id)
          : entry.handle
            ? refAttrsByHandle.get(entry.handle)
            : undefined;

        if (!attr) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Variant attribute reference ${
              entry.id ? `id='${entry.id}'` : `handle='${entry.handle}'`
            } not found`
          );
        }
        if (!attr.is_global) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `Attribute '${attr.name}' (${attr.id}) is not global and cannot be referenced by another product`
          );
        }
      }
    }

    // Build per-product resolution (attribute ids to link, value lookup for variants)
    const result: any[] = [];

    for (let pi = 0; pi < products.length; pi++) {
      const product = { ...products[pi] };
      const entries = product.variant_attributes as any[] | undefined;

      if (!entries) {
        result.push(product);
        continue;
      }

      const existingList = product.id
        ? existingByProductId.get(product.id) ?? []
        : [];

      const attributeIds: string[] = [];
      const byKey = new Map<
        string,
        { attrId: string; valueByKey: Map<string, string> }
      >();

      for (let ei = 0; ei < entries.length; ei++) {
        const entry = entries[ei];
        const inline = isInlineEntry(entry);
        let attr: any;
        let valuesToUpsert: CreateProductAttributeValueDTO[] | undefined;

        if (!inline) {
          if (entry.id) {
            attr =
              refAttrsById.get(entry.id) ??
              existingList.find((a: any) => a.id === entry.id);
          } else if (entry.handle) {
            attr =
              refAttrsByHandle.get(entry.handle) ??
              existingList.find((a: any) => a.handle === entry.handle);
          }
          if (Array.isArray(entry.values) && entry.values.length) {
            valuesToUpsert = entry.values;
          }
        } else {
          const match = existingList.find(
            (a: any) =>
              (entry.id && a.id === entry.id) ||
              (entry.handle && a.handle === entry.handle) ||
              (entry.name && a.name === entry.name)
          );
          if (match) {
            attr = match;
            if (Array.isArray(entry.values) && entry.values.length) {
              valuesToUpsert = entry.values;
            }
          } else {
            attr = createdBySlot.get(`${pi}:${ei}`);
          }
        }

        if (!attr) continue;

        if (valuesToUpsert?.length) {
          const existingNames = new Set<string>(
            (attr.values ?? []).map((v: any) => v.name)
          );
          const newValuePayloads = valuesToUpsert
            .filter((v) => v.name && !existingNames.has(v.name))
            .map((v) => ({ ...v, attribute_id: attr.id }));
          if (newValuePayloads.length) {
            const created = (await this.createProductAttributeValues(
              newValuePayloads as any,
              sharedContext
            )) as any;
            const createdArr = Array.isArray(created) ? created : [created];
            attr = {
              ...attr,
              values: [...(attr.values ?? []), ...createdArr],
            };
          }
        }

        attributeIds.push(attr.id);
        const valueByKey = new Map<string, string>();
        for (const v of attr.values ?? []) {
          if (v.name) valueByKey.set(v.name, v.id);
          if (v.handle) valueByKey.set(v.handle, v.id);
        }
        const lookupEntry = { attrId: attr.id, valueByKey };
        byKey.set(attr.id, lookupEntry);
        if (attr.handle) byKey.set(attr.handle, lookupEntry);
        if (attr.name) byKey.set(attr.name, lookupEntry);
      }

      product.variant_attributes = attributeIds.map((id) => ({ id }));

      if (Array.isArray(product.variants) && product.variants.length) {
        product.variants = product.variants.map((variant: any) => {
          if (variant?.attribute_values === undefined) return variant;
          const resolved = this.resolveVariantAttributeValues_(variant, byKey);
          return { ...variant, attribute_values: resolved };
        });
      }

      result.push(product);
    }

    return result;
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
    const input = (Array.isArray(data) ? data : [data]).map((product) => {
      this.validateProductHandle(product.handle);

      if (!product.handle && product.title) {
        product.handle = toHandle(product.title);
      }

      return product;
    });

    const finalInput = input.some((p) => this.hasVariantAttributeInput_(p))
      ? await this.normalizeVariantAttributes_(input, sharedContext)
      : input;

    const result = await super.createProducts(finalInput, sharedContext);
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
      this.validateProductHandle(update.handle);

      if (!update.handle && update.title) {
        update.handle = toHandle(update.title);
      }

      if (this.hasVariantAttributeInput_(update)) {
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

        const normalized = await this.normalizeVariantAttributes_(
          batch,
          sharedContext
        );

        // @ts-ignore
        const results = await super.updateProducts(normalized, sharedContext);
        const arr = Array.isArray(results) ? results : [results];
        return (wasIdForm ? arr[0] : arr) as any;
      }

      // @ts-ignore
      return await super.updateProducts(
        idOrSelectorOrData as any,
        update,
        sharedContext
      );
    }

    const data = idOrSelectorOrData as (UpdateProductDTO & { id: string })[];
    const input = data.map((product) => {
      this.validateProductHandle(product.handle);

      if (!product.handle && product.title) {
        product.handle = toHandle(product.title);
      }

      return product;
    });

    const finalInput = input.some((p) => this.hasVariantAttributeInput_(p))
      ? await this.normalizeVariantAttributes_(
          input,
          dataOrContext as Context
        )
      : input;

    // @ts-ignore
    return await super.updateProducts(finalInput, dataOrContext as Context);
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
        rejection_reasons: data.rejection_reasons as any,
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
