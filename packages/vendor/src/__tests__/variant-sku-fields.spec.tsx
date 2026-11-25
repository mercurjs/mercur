import { beforeEach, describe, expect, vi, test } from "vitest";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormProvider, type UseFormReturn } from "react-hook-form";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import type { HttpTypes } from "@medusajs/types";
import { TooltipProvider } from "@medusajs/ui";
import type { CustomFieldsModule } from "@mercurjs/dashboard-shared";

const Content = ({ children }: { children?: ReactNode }) =>
  createElement(Fragment, null, children);
let activeForm: UseFormReturn;
let submit: ReturnType<UseFormReturn["handleSubmit"]>;
let submitted: unknown;
let replacementData: unknown;
const ModalForm = ({
  form,
  children,
}: {
  form: UseFormReturn;
  children: ReactNode;
}) => {
  activeForm = form;
  return <FormProvider {...form}>{children}</FormProvider>;
};
const modal = {
  Form: ModalForm,
  Header: Content,
  Title: Content,
  Description: Content,
  Body: Content,
  Footer: Content,
  Close: Content,
};
const mutateAsync = async (input: unknown) => {
  submitted = input;
};

vi.mock("virtual:mercur/config", () => ({ default: {} }));
vi.mock("@components/modals", () => ({
  RouteFocusModal: modal,
  RouteDrawer: modal,
  useRouteModal: () => ({ handleSuccess: () => {} }),
}));
vi.mock("@hooks/api", () => ({
  useFeatureFlags: () => ({ feature_flags: {} }),
}));
vi.mock("@hooks/api/products", () => ({
  useCreateProductVariant: () => ({ mutateAsync, isPending: false }),
  useUpdateProductVariant: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("@components/utilities/keybound-form", () => ({
  KeyboundForm: ({
    onSubmit,
    children,
  }: {
    onSubmit: typeof submit;
    children: ReactNode;
  }) => {
    submit = onSubmit;
    return createElement("form", null, children);
  },
}));
const i18n = createInstance();
await i18n.init({ lng: "en", resources: { en: { translation: {} } } });

const { ExtensionProvider } = await import("@mercurjs/dashboard-shared");
const { CreateProductVariantForm } =
  await import("../pages/products/[id]/variants/create/create-product-variant-form/create-product-variant-form");
const { ProductEditVariantForm } =
  await import("../pages/product-variants/product-variant-edit/components/product-edit-variant-form/product-edit-variant-form");
const product = {
  id: "product_1",
  title: "Product",
} as HttpTypes.AdminProduct;
const variant: Pick<
  HttpTypes.AdminProductVariant,
  "id" | "product_id" | "title" | "sku" | "options"
> = {
  id: "variant_1",
  product_id: "product_1",
  title: "Medium",
  sku: "SKU-42",
  options: [],
};

/** Uses modal adapters so real form providers can render without browser routing. */
function renderForm(
  zone: "create" | "edit",
  customFields?: CustomFieldsModule,
) {
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <ExtensionProvider customFields={customFields}>
          {zone === "create" ? (
            <CreateProductVariantForm product={product} />
          ) : (
            <ProductEditVariantForm
              product={product}
              variant={variant as HttpTypes.AdminProductVariant}
            />
          )}
        </ExtensionProvider>
      </TooltipProvider>
    </I18nextProvider>,
  );
}

describe("Vendor variant SKU field overrides", () => {
  beforeEach(() => {
    submitted = undefined;
    replacementData = undefined;
  });
  test.each(["create", "edit"] as const)(
    "keeps the built-in SKU field without configuration: %s",
    (zone) => {
      const html = renderForm(zone);
      expect(html).toContain('name="sku"');
      expect(html).toContain('name="title"');
      if (zone === "edit") expect(html).toContain('value="SKU-42"');
    },
  );

  test.each(["create", "edit"] as const)(
    "hides SKU only in the configured form: %s",
    (zone) => {
      const customFields: CustomFieldsModule = {
        configs: [
          {
            model: "product_variant",
            forms: [{ zone, fields: { sku: null } }],
          },
        ],
      };
      expect(renderForm(zone, customFields)).not.toContain('name="sku"');
      expect(renderForm(zone, customFields)).toContain('name="title"');
      expect(
        renderForm(zone === "create" ? "edit" : "create", customFields),
      ).toContain('name="sku"');
    },
  );

  test.each(["create", "edit"] as const)(
    "renders a replacement SKU input: %s",
    (zone) => {
      const customFields: CustomFieldsModule = {
        configs: [
          {
            model: "product_variant",
            forms: [
              {
                zone,
                fields: {
                  sku: {
                    validation: {},
                    component: ({ field, data }) => {
                      replacementData = data;
                      return createElement("input", {
                        ...field,
                        "data-testid": "replacement-sku",
                      });
                    },
                  },
                },
              },
            ],
          },
        ],
      };
      const html = renderForm(zone, customFields);
      const replacement = html.match(
        /<input\b[^>]*data-testid="replacement-sku"[^>]*>/,
      )?.[0];
      expect(replacement).toContain('name="sku"');
      expect(html.match(/name="sku"/g)).toHaveLength(1);
      expect(replacementData).toEqual(zone === "create" ? product : variant);
    },
  );

  test.each(["create", "edit"] as const)(
    "submits an entered SKU without configuration: %s",
    async (zone) => {
      renderForm(zone);
      activeForm.setValue("title", "Updated variant");
      activeForm.setValue("sku", "ENTERED-42");
      await submit();
      expect(submitted).toMatchObject({
        title: "Updated variant",
        sku: "ENTERED-42",
      });
    },
  );

  test.each(["create", "edit"] as const)(
    "preserves built-in submission when SKU is hidden: %s",
    async (zone) => {
      renderForm(zone, {
        configs: [
          {
            model: "product_variant",
            forms: [{ zone, fields: { sku: null } }],
          },
        ],
      });
      activeForm.setValue("title", "Updated variant");
      await submit();
      const request: unknown = JSON.parse(JSON.stringify(submitted));
      expect(request).toMatchObject({ title: "Updated variant" });
      if (zone === "edit") expect(request).toMatchObject({ sku: "SKU-42" });
      else expect(request).not.toHaveProperty("sku");
    },
  );
});
