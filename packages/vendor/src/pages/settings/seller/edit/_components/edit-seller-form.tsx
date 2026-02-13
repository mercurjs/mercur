import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, toast } from "@medusajs/ui";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { FileType, FileUpload } from "@components/common/file-upload";
import { Form } from "@components/common/form";
import ImageAvatar from "@components/common/image-avatar/image-avatar";
import { CountrySelect } from "@components/inputs/country-select";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { useUpdateMe } from "@hooks/api";
import { uploadFilesQuery } from "@lib/client";
import { MediaSchema } from "@pages/products/create/constants";
import { HttpTypes } from "@mercurjs/types";

type EditSellerFormProps = HttpTypes.StoreSellerResponse;

const EditSellerSchema = zod.object({
  name: zod.string().min(1),
  handle: zod.string().min(1),
  email: zod.string().email().optional().or(zod.literal("")),
  phone: zod.string().optional().or(zod.literal("")),
  address: zod.object({
    address_1: zod.string().optional().or(zod.literal("")),
    address_2: zod.string().optional().or(zod.literal("")),
    city: zod.string().optional().or(zod.literal("")),
    province: zod.string().optional().or(zod.literal("")),
    postal_code: zod.string().optional().or(zod.literal("")),
    country_code: zod.string().optional().or(zod.literal("")),
  }),
  media: zod.array(MediaSchema).optional(),
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

export const EditSellerForm = ({ seller }: EditSellerFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof EditSellerSchema>>({
    defaultValues: {
      name: seller.name ?? "",
      handle: seller.handle ?? "",
      email: seller.email ?? "",
      phone: seller.phone ?? "",
      address: {
        address_1: seller.address_1 ?? "",
        address_2: seller.address_2 ?? "",
        city: seller.city ?? "",
        province: seller.province ?? "",
        postal_code: seller.postal_code ?? "",
        country_code: seller.country_code ?? "",
      },
      media: [],
    },
    resolver: zodResolver(EditSellerSchema),
  });

  const { fields } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  });

  const { mutateAsync, isPending } = useUpdateMe();

  const handleSubmit = form.handleSubmit(async (values) => {
    let logoUrl = seller.logo || "";

    try {
      if (values.media?.length) {
        const uploaded = await uploadFilesQuery(values.media);
        logoUrl = uploaded.files?.[0]?.url || logoUrl;
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }

    await mutateAsync(
      {
        name: values.name,
        handle: values.handle,
        email: values.email || undefined,
        phone: values.phone || null,
        logo: logoUrl || null,
        address_1: values.address.address_1 || null,
        address_2: values.address.address_2 || null,
        city: values.address.city || null,
        province: values.address.province || null,
        postal_code: values.address.postal_code || null,
        country_code: values.address.country_code || null,
      } as any,
      {
        onSuccess: () => {
          toast.success(t("app.menus.seller.sellerSettings"));
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  // File validation and upload — instead of useCallback, inline for simplicity (matches Location Form simpleness)
  const onUploaded = (files: FileType[]) => {
    const invalidFile = files.find(
      (f) => !SUPPORTED_FORMATS.includes(f.file.type),
    );
    if (invalidFile) {
      form.setError("media", {
        type: "invalid_file",
        message: t("products.media.invalidFileType", {
          name: invalidFile.file.name,
          types: SUPPORTED_FORMATS_FILE_EXTENSIONS.join(", "),
        }),
      });
      return;
    }
    form.clearErrors("media");
    form.setValue("media", [{ ...files[0], isThumbnail: false }]);
  };

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-col gap-y-8 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            <Form.Field
              name="media"
              control={form.control}
              render={() => {
                const previewUrl = fields[0]?.url || seller.logo;

                return (
                  <Form.Item>
                    <Form.Label>{t("store.logo", "Logo")}</Form.Label>
                    {previewUrl && (
                      <div className="mb-2">
                        <ImageAvatar src={previewUrl} size={16} />
                      </div>
                    )}
                    <Form.Control>
                      <FileUpload
                        multiple={false}
                        label={t("products.media.uploadImagesLabel")}
                        hint={t("products.media.uploadImagesHint")}
                        hasError={!!form.formState.errors.media}
                        formats={SUPPORTED_FORMATS}
                        onUploaded={onUploaded}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.name")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
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
                    <Input size="small" {...field} />
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
                    <Input size="small" type="email" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="phone"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.phone")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            {/* Address Fields, using address subobject as in edit-location-form */}
            <Form.Field
              control={form.control}
              name="address.address_1"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.address")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address.address_2"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.address2")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address.company"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.company")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address.phone"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.phone")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.city")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address.province"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.state")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address.postal_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.postalCode")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address.country_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.country")}</Form.Label>
                  <Form.Control>
                    <CountrySelect {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
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
