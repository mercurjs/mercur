'use client';

import { InformationCircleSolid } from '@medusajs/icons';
import { Button, toast, Tooltip } from '@medusajs/ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateProduct } from "@hooks/api"
import { ExtendedAdminProduct, ProductAttribute } from '../../../../types/products';
import { Components } from './Components';

interface Props {
  product: ExtendedAdminProduct;
  attributes: ProductAttribute[];
  id: string;
}

export const ProductAdditionalAttributesForm = ({ product, attributes, id }: Props) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const filteredAttributes = product?.attribute_values?.filter(a => !!a?.attribute_id);
  const defaultValues = filteredAttributes?.reduce((acc: any, curr: any) => {
    acc[curr.attribute_id] = curr.value;
    return acc;
  }, {});

  const form = useForm({
    defaultValues
  });

  const { mutate: updateProduct, isPending: isMutating } = useUpdateProduct(id);

  const handleSubmit = form.handleSubmit(async (data: any) => {
    const values = Object.keys(data).reduce((acc: Array<Record<string, string>>, key) => {
      acc.push({ attribute_id: key, value: data[key] });
      return acc;
    }, []);

    await updateProduct(
      {
        additional_data: { values }
      },
      {
        onSuccess: () => {
          toast.success(
            t('products.edit.successToast', {
              title: product.title
            })
          );
          handleSuccess(`/products/${id}`);
        },
        onError: error => {
          toast.error(error.message);
        }
      }
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col"
      >
        <RouteDrawer.Body className="max-h-[calc(86vh)] overflow-y-auto py-2">
          {attributes?.map((a: ProductAttribute) => (
            <Form.Field
              key={`form-field-${a.handle}-${a.id}`}
              control={form.control}
              name={a.id}
              render={({ field }) => {
                return (
                  <Form.Item
                    key={a.id}
                    className="mb-4 w-full"
                  >
                    <Form.Label className="flex w-full flex-col gap-y-2">
                      <span className="flex items-center gap-x-2">
                        {a.name}
                        {a.description && (
                          <Tooltip content={a.description}>
                            <InformationCircleSolid />
                          </Tooltip>
                        )}
                      </span>

                      <Form.Control>
                        <Components
                          attribute={a}
                          field={field}
                        />
                      </Form.Control>
                    </Form.Label>
                  </Form.Item>
                );
              }}
            />
          ))}
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                type="button"
                disabled={isMutating}
              >
                {t('actions.cancel')}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isMutating}
            >
              {t('actions.save')}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
