import { Fragment, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeSlash } from '@medusajs/icons';
import { AdminApiKeyResponse } from '@medusajs/types';
import { Button, Heading, Input, Prompt, Text, toast } from '@medusajs/ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as zod from 'zod';

import { Form } from '../../../../../components/common/form';
import { RouteFocusModal, useRouteModal } from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { useCreateApiKey } from '../../../../../hooks/api/api-keys';
import { ApiKeyType } from '../../../common/constants';

const ApiKeyCreateSchema = zod.object({
  title: zod.string().min(1)
});

type ApiKeyCreateFormProps = {
  keyType: ApiKeyType;
};

function getRedactedKey(key?: string) {
  if (!key) {
    return '';
  }

  // Replace all characters except the first four and last two with bullets
  const firstThree = key.slice(0, 4);
  const lastTwo = key.slice(-2);

  return `${firstThree}${'•'.repeat(key.length - 6)}${lastTwo}`;
}

export const ApiKeyCreateForm = ({ keyType }: ApiKeyCreateFormProps) => {
  const [createdKey, setCreatedKey] = useState<AdminApiKeyResponse['api_key'] | null>(null);
  const [showRedactedKey, setShowRedactedKey] = useState(true);

  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof ApiKeyCreateSchema>>({
    defaultValues: {
      title: ''
    },
    resolver: zodResolver(ApiKeyCreateSchema)
  });

  const { mutateAsync, isPending } = useCreateApiKey();

  const handleSubmit = form.handleSubmit(async values => {
    await mutateAsync(
      // @ts-ignore
      { title: values.title, type: keyType },
      {
        onSuccess: ({ api_key }) => {
          toast.success(t('apiKeyManagement.create.successToast'));

          switch (keyType) {
            case ApiKeyType.PUBLISHABLE:
              handleSuccess(`/settings/publishable-api-keys/${api_key.id}`);
              break;
            case ApiKeyType.SECRET:
              setCreatedKey(api_key);
              break;
          }
        },
        onError: err => {
          toast.error(err.message);
        }
      }
    );
  });

  const handleCopyToken = () => {
    if (!createdKey) {
      toast.error(t('apiKeyManagement.create.copySecretTokenFailure'));
    }

    navigator.clipboard.writeText(createdKey?.token ?? '');
    toast.success(t('apiKeyManagement.create.copySecretTokenSuccess'));
  };

  const handleGoToSecretKey = () => {
    if (!createdKey) {
      return;
    }

    handleSuccess(`/settings/secret-api-keys/${createdKey.id}`);
  };

  return (
    <Fragment>
      <RouteFocusModal.Form
        form={form}
        data-testid={`${keyType}-api-key-create-form`}
      >
        <KeyboundForm
          className="flex h-full flex-col overflow-hidden"
          onSubmit={handleSubmit}
        >
          <RouteFocusModal.Header data-testid={`${keyType}-api-key-create-header`} />
          <RouteFocusModal.Body
            className="flex flex-1 flex-col overflow-hidden"
            data-testid={`${keyType}-api-key-create-body`}
          >
            <div className="flex flex-1 flex-col items-center overflow-y-auto">
              <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
                <div>
                  <RouteFocusModal.Title asChild>
                    <Heading data-testid={`${keyType}-api-key-create-title`}>
                      {keyType === ApiKeyType.PUBLISHABLE
                        ? t('apiKeyManagement.create.createPublishableHeader')
                        : t('apiKeyManagement.create.createSecretHeader')}
                    </Heading>
                  </RouteFocusModal.Title>
                  <RouteFocusModal.Description asChild>
                    <Text
                      size="small"
                      className="text-ui-fg-subtle"
                      data-testid={`${keyType}-api-key-create-description`}
                    >
                      {keyType === ApiKeyType.PUBLISHABLE
                        ? t('apiKeyManagement.create.createPublishableHint')
                        : t('apiKeyManagement.create.createSecretHint')}
                    </Text>
                  </RouteFocusModal.Description>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Field
                    control={form.control}
                    name="title"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid={`${keyType}-api-key-create-title-item`}>
                          <Form.Label data-testid={`${keyType}-api-key-create-title-label`}>
                            {t('fields.title')}
                          </Form.Label>
                          <Form.Control data-testid={`${keyType}-api-key-create-title-control`}>
                            <Input
                              {...field}
                              data-testid={`${keyType}-api-key-create-title-input`}
                            />
                          </Form.Control>
                          <Form.ErrorMessage
                            data-testid={`${keyType}-api-key-create-title-error`}
                          />
                        </Form.Item>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer data-testid={`${keyType}-api-key-create-footer`}>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  data-testid={`${keyType}-api-key-create-cancel-button`}
                >
                  {t('actions.cancel')}
                </Button>
              </RouteFocusModal.Close>
              <Button
                size="small"
                type="submit"
                isLoading={isPending}
                data-testid={`${keyType}-api-key-create-save-button`}
              >
                {t('actions.save')}
              </Button>
            </div>
          </RouteFocusModal.Footer>
        </KeyboundForm>
      </RouteFocusModal.Form>
      {keyType === ApiKeyType.SECRET && (
        <Prompt
          variant="confirmation"
          open={!!createdKey}
          data-testid="secret-api-key-created-prompt"
        >
          <Prompt.Content
            className="w-fit max-w-[42.5%]"
            data-testid="secret-api-key-created-prompt-content"
          >
            <Prompt.Header data-testid="secret-api-key-created-prompt-header">
              <Prompt.Title data-testid="secret-api-key-created-prompt-title">
                {t('apiKeyManagement.create.secretKeyCreatedHeader')}
              </Prompt.Title>
              <Prompt.Description data-testid="secret-api-key-created-prompt-description">
                {t('apiKeyManagement.create.secretKeyCreatedHint')}
              </Prompt.Description>
            </Prompt.Header>
            <div
              className="flex flex-col gap-y-3 px-6 py-4"
              data-testid="secret-api-key-created-prompt-token-container"
            >
              <div
                className="grid h-8 grid-cols-[1fr_32px] items-center overflow-hidden rounded-md bg-ui-bg-component shadow-borders-base"
                data-testid="secret-api-key-created-prompt-token-display"
              >
                <div
                  className="flex items-center px-2"
                  data-testid="secret-api-key-created-prompt-token-text"
                >
                  <Text
                    family="mono"
                    size="small"
                  >
                    {showRedactedKey ? getRedactedKey(createdKey?.token) : createdKey?.token}
                  </Text>
                </div>
                <button
                  className="flex size-8 appearance-none items-center justify-center border-l text-ui-fg-muted transition-fg hover:bg-ui-bg-base-hover active:bg-ui-bg-base-pressed active:text-ui-fg-subtle"
                  type="button"
                  onClick={() => setShowRedactedKey(!showRedactedKey)}
                  data-testid="secret-api-key-created-prompt-toggle-visibility-button"
                >
                  {showRedactedKey ? <EyeSlash /> : <Eye />}
                </button>
              </div>
              <Button
                size="small"
                variant="secondary"
                type="button"
                className="w-full"
                onClick={handleCopyToken}
                data-testid="secret-api-key-created-prompt-copy-button"
              >
                {t('apiKeyManagement.actions.copy')}
              </Button>
            </div>
            <Prompt.Footer
              className="border-t py-4"
              data-testid="secret-api-key-created-prompt-footer"
            >
              <Prompt.Action
                onClick={handleGoToSecretKey}
                data-testid="secret-api-key-created-prompt-continue-button"
              >
                {t('actions.continue')}
              </Prompt.Action>
            </Prompt.Footer>
          </Prompt.Content>
        </Prompt>
      )}
    </Fragment>
  );
};
