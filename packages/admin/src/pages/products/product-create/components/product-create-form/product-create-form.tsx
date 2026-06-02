import { HttpTypes } from "@medusajs/types";
import { Button, toast } from "@medusajs/ui";
import { ReactNode, useEffect, useMemo, Children } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals";
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form";
import { useCreateProduct } from "../../../../../hooks/api/products";
import { useRegions } from "../../../../../hooks/api";
import { sdk } from "../../../../../lib/client";
import {
  PRODUCT_CREATE_FORM_DEFAULTS,
  ProductCreateSchema,
} from "../../constants";
import { ProductCreateSchemaType } from "../../types";
import {
  generateVariantsFromAttributes,
  normalizeProductFormValues,
} from "../../utils";
import { ProductCreateAttributesForm } from "../product-create-attributes-form";
import { ProductCreateDetailsForm } from "../product-create-details-form";
import { ProductCreateOrganizeForm } from "../product-create-organize-form";
import { ProductCreateVariantsForm } from "../product-create-variants-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeepPartial } from "react-hook-form";

const SAVE_DRAFT_BUTTON = "save-draft-button";

type ProductCreateFormProps = {
  children?: ReactNode;
  schema?: z.ZodType<ProductCreateSchemaType>;
  defaultValues?: DeepPartial<ProductCreateSchemaType>;
};

export const ProductCreateForm = ({
  children,
  schema,
  defaultValues: extraDefaults,
}: ProductCreateFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const form = useForm<ProductCreateSchemaType>({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      ...extraDefaults,
    } as ProductCreateSchemaType,
    resolver: zodResolver(schema ?? ProductCreateSchema),
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

  const watchedAttributes = useWatch({
    control: form.control,
    name: "attributes",
  });

  // Generate variants from variant-axis attributes
  useEffect(() => {
    const currentVariants = form.getValues("variants") ?? [];
    const newVariants = generateVariantsFromAttributes(
      watchedAttributes ?? [],
      currentVariants,
    );

    if (
      JSON.stringify(newVariants.map((v) => v.options)) !==
      JSON.stringify(currentVariants.map((v) => v.options))
    ) {
      form.setValue("variants", newVariants);
    }
  }, [watchedAttributes]);

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
      }) as any,
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

  const defaultTabs = useMemo(
    () => [
      <ProductCreateDetailsForm key="details" />,
      <ProductCreateOrganizeForm key="organize" />,
      <ProductCreateAttributesForm key="attributes" />,
      <ProductCreateVariantsForm key="variants" />,
    ],
    [],
  );

  const hasCustomChildren = Children.count(children) > 0;

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending || isRegionsPending}
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
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  );
};
