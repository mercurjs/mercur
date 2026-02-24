import { useCallback } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { FileType, FileUpload } from "@components/common/file-upload"
import { Form } from "@components/common/form"
import { EditStoreSchema } from '../../../../store/store-edit/components/edit-store-form/edit-store-form';
import { MediaSchema } from '../../../create/constants'
import { EditProductMediaSchemaType, ProductCreateSchemaType } from '../../../create/types'

type Media = z.infer<typeof MediaSchema>;

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/svg+xml'];

const SUPPORTED_FORMATS_FILE_EXTENSIONS = ['.jpeg', '.png', '.webp', '.heic', '.svg'];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export const UploadMediaFormItem = ({
  form,
  append,
  showHint = true
}: {
  form:
    | UseFormReturn<ProductCreateSchemaType>
    | UseFormReturn<EditProductMediaSchemaType>
    | UseFormReturn<z.infer<typeof EditStoreSchema>>;
  append: (value: Media) => void;
  showHint?: boolean;
}) => {
  const { t } = useTranslation();

  const hasInvalidFiles = useCallback(
    (fileList: FileType[]) => {
      const invalidTypeFile = fileList.find(f => !SUPPORTED_FORMATS.includes(f.file.type));

      if (invalidTypeFile) {
        form.setError('media', {
          type: 'invalid_file',
          message: t('products.media.invalidFileType', {
            name: invalidTypeFile.file.name,
            types: SUPPORTED_FORMATS_FILE_EXTENSIONS.join(', ')
          })
        });

        return true;
      }

      const oversizedFile = fileList.find(f => f.file.size > MAX_FILE_SIZE);

      if (oversizedFile) {
        form.setError('media', {
          type: 'invalid_file',
          message: t('products.media.fileTooLarge', {
            name: oversizedFile.file.name,
            maxSize: '2MB'
          })
        });

        return true;
      }

      return false;
    },
    [form, t]
  );

  const onUploaded = useCallback(
    (files: FileType[]) => {
      form.clearErrors('media');
      if (hasInvalidFiles(files)) {
        return;
      }

      files.forEach(f => append({ ...f, isThumbnail: false }));
    },
    [form, append, hasInvalidFiles]
  );

  return (
    <Form.Field
      control={form.control as UseFormReturn<EditProductMediaSchemaType>['control']}
      name="media"
      render={() => {
        return (
          <Form.Item>
            <div className="flex flex-col gap-y-2">
              <div className="flex flex-col gap-y-1">
                <Form.Label optional>{t('products.media.label')}</Form.Label>
                {showHint && <Form.Hint>{t('products.media.editHint')}</Form.Hint>}
              </div>
              <Form.Control>
                <FileUpload
                  label={t('products.media.uploadImagesLabel')}
                  hint={t('products.media.uploadImagesHint')}
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
  );
};
