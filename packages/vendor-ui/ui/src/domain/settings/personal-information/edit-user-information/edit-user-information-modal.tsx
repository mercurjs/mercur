import { User } from "@medusajs/medusa";
import {
  useAdminGetSession,
  useAdminStore,
  useAdminUpdateStore,
  useAdminUpdateUser,
} from "medusa-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Button from "../../../../components/fundamentals/button";
import InputField from "../../../../components/molecules/input";
import Modal from "../../../../components/molecules/modal";
import useNotification from "../../../../hooks/use-notification";
import TextArea from "../../../../components/molecules/textarea";
import { ExtendedStoreDTO } from "@medusajs/medusa/dist/types/store";

type Props = {
  user: Omit<User, "password_hash">;
  open: boolean;
  onClose: () => void;
};

type EditInformationFormType = {
  first_name: string | null;
  last_name: string | null;
  store_name: string;
  billing_info: string | null;
};

const EditUserInformationModal = ({ user, open, onClose }: Props) => {
  const { mutate, isLoading: isSubmitting } = useAdminUpdateUser(user.id);
  const { refetch } = useAdminGetSession();
  const { store } = useAdminStore();
  const { mutateAsync } = useAdminUpdateStore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditInformationFormType>({
    defaultValues: getDefaultValues(user, store),
  });

  useEffect(() => {
    reset(getDefaultValues(user, store));
  }, [open, user]);

  const notification = useNotification();

  const onSubmit = handleSubmit((data) => {
    const { billing_info, store_name, ...userData } = data;

    mutateAsync({
      name: store_name,
      metadata: { billing_info },
    });

    mutate(
      // @ts-ignore
      userData,
      {
        onSuccess: () => {
          notification(
            t("edit-user-information-success", "Success"),
            t(
              "edit-user-information-your-information-was-successfully-updated",
              "Your information was successfully updated"
            ),
            "success"
          );
          refetch();
          onClose();
        },
        onError: () => {},
      }
    );
  });

  return (
    <Modal handleClose={onClose} open={open} isLargeModal={false}>
      <Modal.Header handleClose={onClose}>
        <h1 className="inter-xlarge-semibold">
          {t("edit-user-information-edit-information", "Edit information")}
        </h1>
      </Modal.Header>
      <Modal.Body>
        <Modal.Content>
          <div className="gap-y-base flex flex-col">
            <div className="gap-x-base grid grid-cols-2">
              <InputField
                {...register("first_name")}
                errors={errors}
                label="First name"
              />
              <InputField
                {...register("last_name")}
                errors={errors}
                label="Last name"
              />
            </div>
            <InputField
              {...register("store_name")}
              errors={errors}
              label="Store name"
            />
            <TextArea
              {...register("billing_info")}
              errors={errors}
              label="Billing info"
            />
          </div>
        </Modal.Content>
        <Modal.Footer className="border-grey-20 pt-base border-t">
          <div className="gap-x-xsmall flex w-full items-center justify-end">
            <Button variant="secondary" size="small" onClick={onClose}>
              {t("edit-user-information-cancel", "Cancel")}
            </Button>
            <Button
              variant="primary"
              size="small"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={onSubmit}
            >
              {t("edit-user-information-submit-and-close", "Submit and close")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  );
};

const getDefaultValues = (
  user: Omit<User, "password_hash">,
  store: ExtendedStoreDTO
) => {
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    billing_info: store.metadata?.billing_info ?? "",
    store_name: store.name,
  };
};

export default EditUserInformationModal;
