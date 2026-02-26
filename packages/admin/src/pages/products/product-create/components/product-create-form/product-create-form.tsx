import { HttpTypes } from "@medusajs/types";
import { Button, toast } from "@medusajs/ui";
import { Children, ReactNode, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals";
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form";
import { TabDefinition } from "../../../../../components/tabbed-form/types";
import { useCreateProduct } from "../../../../../hooks/api/products";
import { useRegions } from "../../../../../hooks/api";
import { sdk } from "../../../../../lib/client";
import {
  PRODUCT_CREATE_FORM_DEFAULTS,
  ProductCreateSchema,
} from "../../constants";
import { ProductCreateSchemaType } from "../../types";
import { normalizeProductFormValues } from "../../utils";
import { ProductCreateDetailsForm } from "../product-create-details-form";
import { ProductCreateInventoryKitForm } from "../product-create-inventory-kit-form";
import { ProductCreateOrganizeForm } from "../product-create-organize-form";
import { ProductCreateVariantsForm } from "../product-create-variants-form";
import { zodResolver } from "@hookform/resolvers/zod";

const SAVE_DRAFT_BUTTON = "save-draft-button";

type ProductCreateFormProps = {
  defaultChannel?: HttpTypes.AdminSalesChannel;
  children?: ReactNode;
};

export const ProductCreateForm = ({
  defaultChannel,
  children,
}: ProductCreateFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const form = useForm<ProductCreateSchemaType>({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      sales_channels: defaultChannel
        ? [{ id: defaultChannel.id, name: defaultChannel.name }]
        : [],
    } as ProductCreateSchemaType,
    resolver: zodResolver(ProductCreateSchema),
  });

  const { mutateAsync, isPending } = useCreateProduct();

  const {
    regions,
    isPending: isRegionsPending,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions({ limit: 9999 });

  if (isRegionsError) {
    throw regionsError;
  }

  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {};
    }

    return regions.reduce(
      (acc, reg) => {
        acc[reg.id] = reg.currency_code;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [regions]);

  /**
   * TODO: Important to revisit this - use variants watch so high in the tree can cause needless rerenders of the entire page
   * which is suboptimal when rerenders are caused by bulk editor changes
   */

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  });

  const handleSubmit = form.handleSubmit(async (values, e) => {
    if (isRegionsPending) {
      return;
    }

    let isDraftSubmission = false;
    if (e?.nativeEvent instanceof SubmitEvent) {
      const submitter = e?.nativeEvent?.submitter as HTMLButtonElement;
      isDraftSubmission = submitter.dataset.name === SAVE_DRAFT_BUTTON;
    }

    const media = values.media || [];
    const payload = { ...values, media: undefined };

    let uploadedMedia: (HttpTypes.AdminFile & { isThumbnail: boolean })[] = [];
    try {
      if (media.length) {
        const thumbnailReq = media.find((m) => m.isThumbnail);
        const otherMediaReq = media.filter((m) => !m.isThumbnail);

        const fileReqs = [];
        if (thumbnailReq) {
          fileReqs.push(
            sdk.admin.uploads
              .mutate({ files: [thumbnailReq.file] })
              .then((r) => r.files.map((f) => ({ ...f, isThumbnail: true }))),
          );
        }
        if (otherMediaReq?.length) {
          fileReqs.push(
            sdk.admin.uploads
              .mutate({
                files: otherMediaReq.map((m) => m.file),
              })
              .then((r) => r.files.map((f) => ({ ...f, isThumbnail: false }))),
          );
        }

        uploadedMedia = (await Promise.all(fileReqs)).flat();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }

    await mutateAsync(
      normalizeProductFormValues({
        ...payload,
        media: uploadedMedia,
        status: (isDraftSubmission ? "draft" : "published") as any,
        regionsCurrencyMap,
      }),
      {
        onSuccess: (data) => {
          toast.success(
            t("products.create.successToast", {
              title: data.product.title,
            }),
          );

          handleSuccess(`../${data.product.id}`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  const transformTabs = useCallback(
    (tabs: TabDefinition<ProductCreateSchemaType>[]) => {
      const showInventoryTab = watchedVariants?.some(
        (v) => v.manage_inventory && v.inventory_kit
      ) ?? false;

      return tabs.map((tab) => {
        if (tab.id === "inventory") {
          return {
            ...tab,
            isVisible: () => showInventoryTab,
          };
        }
        return tab;
      });
    },
    [watchedVariants],
  );

  const defaultTabs = (
    <>
      <ProductCreateDetailsForm key="details" />
      <ProductCreateOrganizeForm key="organize" />
      <ProductCreateVariantsForm key="variants" />
      <ProductCreateInventoryKitForm key="inventory" />
    </>
  );

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending || isRegionsPending}
      transformTabs={transformTabs}
      footer={({ isLastTab, onNext, isLoading }) => (
        <div
          className="flex items-center justify-end gap-x-2"
          data-testid="product-create-form-footer-actions"
        >
          <RouteFocusModal.Close asChild>
            <Button
              variant="secondary"
              size="small"
              data-testid="product-create-form-cancel-button"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            data-name={SAVE_DRAFT_BUTTON}
            size="small"
            type="submit"
            isLoading={isLoading}
            className="whitespace-nowrap"
            data-testid="product-create-form-save-draft-button"
          >
            {t("actions.saveAsDraft")}
          </Button>
          {isLastTab ? (
            <Button
              data-name="publish-button"
              key="submit-button"
              type="submit"
              variant="primary"
              size="small"
              isLoading={isLoading}
              data-testid="product-create-form-publish-button"
            >
              {t("actions.publish")}
            </Button>
          ) : (
            <Button
              key="next-button"
              type="button"
              variant="primary"
              size="small"
              onClick={() => onNext()}
              data-testid="product-create-form-continue-button"
            >
              {t("actions.continue")}
            </Button>
          )}
        </div>
      )}
    >
      {Children.count(children) > 0 ? children : defaultTabs}
    </TabbedForm>
  );
};
