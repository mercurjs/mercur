import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, toast } from "@medusajs/ui";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { useCallback } from "react";
import { HttpTypes } from "@medusajs/types";

import { Form } from "@components/common/form";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { useUpdateUser } from "@hooks/api/users";
import { TeamMemberProps } from "@custom-types/user";
import { MediaSchema } from "@pages/products/create/constants";
import { FileType, FileUpload } from "@components/common/file-upload";
import { uploadFilesQuery } from "@lib/client";

type EditProfileProps = {
  user: TeamMemberProps;
};

const EditProfileSchema = zod.object({
  name: zod.string().optional(),
  media: zod.array(MediaSchema).optional(),
  phone: zod.string().optional(),
  bio: zod.string().optional(),
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

export const EditProfileForm = ({ user }: EditProfileProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof EditProfileSchema>>({
    defaultValues: {
      name: user.name ?? "",
      phone: user.phone ?? "",
      bio: user.bio ?? "",
      media: [],
    },
    resolver: zodResolver(EditProfileSchema),
  });

  const { fields } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  });

  const { mutateAsync, isPending } = useUpdateUser(user.id!);

  const handleSubmit = form.handleSubmit(async (values) => {
    let uploadedMedia: (HttpTypes.AdminFile & {
      isThumbnail: boolean;
    })[] = [];
    try {
      if (values.media?.length) {
        const fileReqs = [];
        fileReqs.push(
          uploadFilesQuery(values.media).then((r: any) =>
            r.files.map((f: any) => ({
              ...f,
              isThumbnail: false,
            })),
          ),
        );

        uploadedMedia = (await Promise.all(fileReqs)).flat();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }

    await mutateAsync(
      {
        name: values.name,
        photo: uploadedMedia[0]?.url || user.photo || "",
        phone: values.phone,
        bio: values.bio,
      },
      {
        onError: (error) => {
          toast.error(error.message);
          return;
        },
      },
    );

    toast.success(t("profile.toast.edit"));
    handleSuccess();
  });

  const hasInvalidFiles = useCallback(
    (fileList: FileType[]) => {
      const invalidFile = fileList.find(
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

        return true;
      }

      return false;
    },
    [form, t],
  );

  const onUploaded = useCallback(
    (files: FileType[]) => {
      form.clearErrors("media");
      if (hasInvalidFiles(files)) {
        return;
      }

      form.setValue("media", [{ ...files[0], isThumbnail: false }]);
    },
    [form, hasInvalidFiles],
  );

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-8">
            <Form.Field
              name="media"
              control={form.control}
              render={() => {
                return (
                  <Form.Item>
                    <div className="flex flex-col gap-y-2">
                      <div className="flex flex-col gap-y-1">
                        <Form.Label>Profile picture</Form.Label>
                      </div>
                      <Form.Control>
                        <FileUpload
                          uploadedImage={fields[0]?.url || user.photo || ""}
                          multiple={false}
                          label={t("products.media.uploadImagesLabel")}
                          hint={t("products.media.uploadImagesHint")}
                          hasError={!!form.formState.errors.media}
                          formats={SUPPORTED_FORMATS}
                          onUploaded={onUploaded}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </div>
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Name</Form.Label>
                  <Form.Control>
                    <Input {...field} />
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
                  <Form.Label>Phone</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="bio"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Bio</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
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
