import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, Textarea, toast } from "@medusajs/ui";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { useCallback } from "react";

import { FileType, FileUpload } from "@components/common/file-upload";
import { Form } from "@components/common/form";
import { SwitchBox } from "@components/common/switch-box";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { uploadFilesQuery } from "@lib/client";
import { MediaSchema } from "@pages/products/product-create/constants";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";
import { useUpdateSeller } from "@hooks/api/sellers";
import { SellerStatus } from "@mercurjs/types";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreEditFormProps = {
  seller: Seller;
};

const EditStoreSchema = zod.object({
  name: zod.string().min(1),
  handle: zod.string().min(1),
  email: zod.string().email().optional().or(zod.literal("")),
  description: zod.string().optional().or(zod.literal("")),
  website_url: zod.string().url().optional().or(zod.literal("")),
  status: zod.nativeEnum(SellerStatus),
  is_premium: zod.boolean(),
  media: zod.array(MediaSchema).optional(),
  bannerMedia: zod.array(MediaSchema).optional(),
});

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/svg+xml",
];

const SUPPORTED_FORMATS_FILE_EXTENSIONS = [
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".svg",
];

export const StoreEditForm = ({ seller }: StoreEditFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof EditStoreSchema>>({
    defaultValues: {
      name: seller.name ?? "",
      handle: seller.handle ?? "",
      email: seller.email ?? "",
      description: seller.description ?? "",
      website_url: seller.website_url ?? "",
      status: (seller.status as SellerStatus) ?? SellerStatus.PENDING_APPROVAL,
      is_premium: seller.is_premium ?? false,
      media: seller.logo
        ? [{ id: "existing-logo", url: seller.logo, isThumbnail: false, file: null }]
        : [],
      bannerMedia: seller.banner
        ? [{ id: "existing-banner", url: seller.banner, isThumbnail: false, file: null }]
        : [],
    },
    resolver: zodResolver(EditStoreSchema),
  });

  const { fields: logoFields } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  });

  const { fields: bannerFields } = useFieldArray({
    name: "bannerMedia",
    control: form.control,
    keyName: "field_id",
  });

  const { mutateAsync, isPending } = useUpdateSeller(seller.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    let logoUrl: string | null = null;
    let bannerUrl: string | null = null;

    const newLogoFile = values.media?.find((m) => m.file);
    const newBannerFile = values.bannerMedia?.find((m) => m.file);

    try {
      if (newLogoFile) {
        const uploaded = await uploadFilesQuery([newLogoFile]);
        logoUrl = uploaded.files?.[0]?.url || null;
      } else if (values.media?.length) {
        logoUrl = values.media[0].url;
      }

      if (newBannerFile) {
        const uploaded = await uploadFilesQuery([newBannerFile]);
        bannerUrl = uploaded.files?.[0]?.url || null;
      } else if (values.bannerMedia?.length) {
        bannerUrl = values.bannerMedia[0].url;
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      return;
    }

    await mutateAsync(
      {
        name: values.name,
        handle: values.handle,
        email: values.email || undefined,
        description: values.description || null,
        website_url: values.website_url || null,
        status: values.status,
        is_premium: values.is_premium,
        logo: logoUrl,
        banner: bannerUrl,
      },
      {
        onSuccess: () => {
          toast.success(
            t("stores.edit.successToast", { name: values.name ?? values.email }),
          );
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  const hasInvalidFiles = useCallback(
    (fileList: FileType[], fieldName: "media" | "bannerMedia") => {
      const invalidFile = fileList.find(
        (f) => !SUPPORTED_FORMATS.includes(f.file.type),
      );

      if (invalidFile) {
        form.setError(fieldName, {
          type: "invalid_file",
          message: t("products.media.invalidFileType", {
            name: invalidFile.file.name,
            types: SUPPORTED_FORMATS_FILE_EXTENSIONS.join(", "),
          }),
        });

        return true;
      }

      return false;
    },
    [form, t],
  );

  const onLogoUploaded = (files: FileType[]) => {
    form.clearErrors("media");
    if (hasInvalidFiles(files, "media")) {
      return;
    }

    form.setValue("media", [{ ...files[0], isThumbnail: false }]);
  };

  const onBannerUploaded = (files: FileType[]) => {
    form.clearErrors("bannerMedia");
    if (hasInvalidFiles(files, "bannerMedia")) {
      return;
    }

    form.setValue("bannerMedia", [{ ...files[0], isThumbnail: false }]);
  };

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.name")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.handle")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.email")}</Form.Label>
                  <Form.Control>
                    <Input type="email" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.description")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.website")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="status"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>{t("fields.status")}</Form.Label>
                  <Form.Control>
                    <Select onValueChange={onChange} {...field}>
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {Object.values(SellerStatus).map((status) => (
                          <Select.Item key={status} value={status}>
                            {t(`stores.status.${status}`)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              name="media"
              control={form.control}
              render={() => {
                const logoFile = logoFields[0];
                const previewUrl = logoFile?.url || null;

                return (
                  <Form.Item>
                    <Form.Label optional>{t("store.logo", "Logo")}</Form.Label>
                    <Form.Control>
                      <FileUpload
                        uploadedImage={previewUrl}
                        fileName={logoFile?.file?.name}
                        fileSize={logoFile?.file?.size}
                        multiple={false}
                        label={t("products.media.uploadImagesLabel")}
                        hint={t("products.media.uploadImagesHint")}
                        hasError={!!form.formState.errors.media}
                        formats={SUPPORTED_FORMATS}
                        onUploaded={onLogoUploaded}
                        onRemove={() => form.setValue("media", [])}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              name="bannerMedia"
              control={form.control}
              render={() => {
                const bannerFile = bannerFields[0];
                const previewUrl = bannerFile?.url || null;

                return (
                  <Form.Item>
                    <Form.Label optional>{t("store.banner", "Banner")}</Form.Label>
                    <Form.Control>
                      <FileUpload
                        uploadedImage={previewUrl}
                        fileName={bannerFile?.file?.name}
                        fileSize={bannerFile?.file?.size}
                        multiple={false}
                        label={t("products.media.uploadImagesLabel")}
                        hint={t("products.media.uploadImagesHint")}
                        hasError={!!form.formState.errors.bannerMedia}
                        formats={SUPPORTED_FORMATS}
                        onUploaded={onBannerUploaded}
                        onRemove={() => form.setValue("bannerMedia", [])}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
          </div>
          <SwitchBox
            control={form.control}
            name="is_premium"
            label={t("fields.premium")}
            description={t("stores.premium.description")}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
