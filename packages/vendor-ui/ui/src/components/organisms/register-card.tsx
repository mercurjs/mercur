import { useForm } from "react-hook-form";

import { useState } from "react";
import clsx from "clsx";
import useNotification from "../../hooks/use-notification";
import { useRegisterVendor } from "../../pages/register";
import SigninInput from "../molecules/input-signin";
import Button from "../fundamentals/button";

type FormValues = {
  email: string;
  password: string;
};

const RegisterCard = () => {
  const [isInvalidRegister, setIsInvalidRegister] = useState(false);
  const [isDuplicatedEmail, setIsDuplicatedEmail] = useState(false);

  const notification = useNotification();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: registerVendor, isLoading: isRegisterLoading } =
    useRegisterVendor();

  const onSubmit = async (values: FormValues) => {
    registerVendor(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          setIsInvalidRegister(false);
          setIsDuplicatedEmail(false);
          setValue("email", "");
          setValue("password", "");

          notification(
            "Sukces",
            "Your account has been created. Once it has been approved by the administrator, you will be notified by email.",
            "success"
          );
        },
        onError: (e) => {
          if (e) {
            if (
              // @ts-ignore
              e.response.data.message ===
              "A user with the same email already exists"
            ) {
              setIsDuplicatedEmail(true);
            }
            if (
              // @ts-ignore
              e.response.data.type === "duplicate_error" ||
              // @ts-ignore
              e.response.data.type === "invalid_data"
            ) {
              setIsDuplicatedEmail(true);
            }
            setIsInvalidRegister(true);
          }
        },
      }
    );
  };

  return (
    <div className="gap-y-large flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col items-center">
          <h1 className="inter-xlarge-semibold text-grey-90 mb-large text-[20px]">
            Register on Vendor Panel
          </h1>
          <div>
            <SigninInput
              placeholder="Email"
              {...register("email", { required: true })}
              autoComplete="email"
              className={clsx("mb-xsmall", {
                "border border-rose-50": errors.email || isDuplicatedEmail,
              })}
            />
            <SigninInput
              placeholder="Password"
              type={"password"}
              {...register("password", { required: true })}
              autoComplete="new-password"
              className={clsx("mb-xsmall", {
                "border border-rose-50": errors.password,
              })}
            />
            {isInvalidRegister && (
              <span className="text-rose-50 w-full mt-2 inter-small-regular">
                {isDuplicatedEmail
                  ? "A user with the same email already exists."
                  : "Incorrect data was entered."}
              </span>
            )}
          </div>
          <Button
            className="rounded-rounded inter-base-regular mt-4 w-[280px]"
            variant="secondary"
            size="medium"
            type="submit"
            loading={isRegisterLoading}
          >
            Register
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterCard;
