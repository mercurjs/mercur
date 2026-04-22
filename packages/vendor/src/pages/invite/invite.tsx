import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Heading,
  Hint,
  Input,
  Text,
  toast,
} from "@medusajs/ui";
import i18n from "i18next";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { decodeToken } from "react-jwt";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";

import { Form } from "@components/common/form";
import AvatarBox from "@components/common/logo-box/avatar-box";
import { useSignInForInvite, useSignUpForInvite } from "@hooks/api/auth";
import { useAcceptInvite } from "@hooks/api/invites";
import { useSelectSeller } from "@hooks/api";
import { isFetchError } from "@lib/is-fetch-error";
import { sdk } from "@lib/client";

const CreateAccountSchema = z
  .object({
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    password: z.string().min(1),
    repeat_password: z.string().optional(),
    existing_member: z.boolean(),
  })
  .superRefine(
    ({ first_name, last_name, password, repeat_password, existing_member }, ctx) => {
      if (!existing_member) {
        if (!first_name || first_name.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t("register.validation.firstNameRequired"),
            path: ["first_name"],
          });
        }
        if (!last_name || last_name.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t("register.validation.lastNameRequired"),
            path: ["last_name"],
          });
        }
        if (!repeat_password || password !== repeat_password) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t("invite.passwordMismatch"),
            path: ["repeat_password"],
          });
        }
      }
    },
  );

type DecodedInvite = {
  id: string;
  jti: any;
  exp: string;
  iat: number;
  email: string;
  seller_name: string;
  existing_member: boolean;
};

export const Invite = () => {
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");
  const invite: DecodedInvite | null = token ? decodeToken(token) : null;
  const isValidInvite = invite && validateDecodedInvite(invite);

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <div className="flex w-full flex-col lg:w-[584px] lg:shrink-0 h-full bg-ui-bg-base border-r border-ui-border-base overflow-y-auto">
        <AnimatePresence mode="wait">
          {success && invite ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-1 flex-col items-center justify-center p-8 lg:px-14"
            >
              <SuccessView sellerName={invite.seller_name} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-1 flex-col p-8 lg:px-14 lg:py-12"
            >
              <AvatarBox />
              <div className="mt-8 w-full">
                {isValidInvite ? (
                  <CreateView
                    token={token!}
                    invite={invite}
                    onSuccess={() => setSuccess(true)}
                  />
                ) : (
                  <InvalidView />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{
          backgroundImage: "url(/onboarding/bg.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <img
          src="/onboarding/0.png"
          alt=""
          className="w-[75%] max-h-[75%] object-contain"
        />
      </div>
    </div>
  );
};

const SuccessView = ({ sellerName }: { sellerName: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: selectSeller } = useSelectSeller();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    const redirect = async () => {
      await new Promise((r) => setTimeout(r, 2500));

      try {
        const { seller_members } = await sdk.vendor.sellers.query({});
        if (seller_members?.length === 1) {
          await selectSeller({ seller_id: seller_members[0].seller.id });
          navigate("/", { replace: true });
          return;
        }
      } catch {
        // Fall through
      }

      navigate("/store-select", { replace: true });
    };

    redirect();
  }, [navigate, selectSeller]);

  return (
    <div className="flex flex-col items-center text-center">
      <AvatarBox checked />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Heading>
          {t("invite.successTitle", { name: sellerName })}
        </Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          {t("invite.successHint")}
        </Text>
      </motion.div>
    </div>
  );
};

const LoginLink = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-8">
      <span className="text-ui-fg-muted txt-small">
        {t("invite.alreadyHaveAccount", "Already have an account?")}{" "}
        <Link
          to="/login"
          className="txt-small text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
        >
          {t("invite.logIn", "Log in")}
        </Link>
      </span>
    </div>
  );
};

const InvalidView = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <Heading>{t("invite.invalidTokenTitle")}</Heading>
      <Text size="small" className="text-ui-fg-subtle mt-1">
        {t("invite.invalidTokenHint")}
      </Text>
      <LoginLink />
    </div>
  );
};

const CreateView = ({
  token,
  invite,
  onSuccess,
}: {
  token: string;
  invite: DecodedInvite;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const [invalid, setInvalid] = useState(false);

  const isExistingMember = invite.existing_member;

  const form = useForm<z.infer<typeof CreateAccountSchema>>({
    resolver: zodResolver(CreateAccountSchema),
    defaultValues: {
      email: invite.email || "",
      first_name: "",
      last_name: "",
      password: "",
      repeat_password: "",
      existing_member: isExistingMember,
    },
  });

  const { mutateAsync: signUp, isPending: isCreatingAuthUser } =
    useSignUpForInvite();

  const { mutateAsync: signIn, isPending: isSigningIn } =
    useSignInForInvite();

  const { mutateAsync: acceptInvite, isPending: isAcceptingInvite } =
    useAcceptInvite();

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const { token: authToken } = isExistingMember
        ? await signIn({
            email: data.email,
            password: data.password,
          })
        : await signUp({
            email: data.email,
            password: data.password,
          });

      await acceptInvite({
        invite_token: token,
        auth_token: authToken,
        first_name: isExistingMember ? undefined : data.first_name,
        last_name: isExistingMember ? undefined : data.last_name,
      });

      // Re-login to get a fresh token with updated actor_id
      const { token: freshToken } = await signIn({
        email: data.email,
        password: data.password,
      });

      // Establish session with the fresh token
      await sdk.auth.session.mutate({
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        },
      });

      toast.success(t("invite.toast.accepted"));
      onSuccess();
    } catch (error) {
      if (isFetchError(error)) {
        if (error.status === 401) {
          form.setError("root", {
            type: "manual",
            message: t("errors.invalidCredentials"),
          });
          return;
        }

        if (error.status === 400) {
          form.setError("root", {
            type: "manual",
            message: t("invite.invalidInvite"),
          });
          setInvalid(true);
          return;
        }
      }

      form.setError("root", {
        type: "manual",
        message: t("errors.serverError"),
      });
    }
  });

  const serverError = form.formState.errors.root?.message;
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.repeat_password?.message;

  return (
    <div className="flex w-full flex-col">
      <Heading>
        {t("invite.title", {
          name: invite.seller_name,
        })}
      </Heading>
      <Text size="small" className="text-ui-fg-subtle mt-1 mb-6">
        {isExistingMember
          ? t("invite.existingMemberHint")
          : t("invite.hint")}
      </Text>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.email")}</Form.Label>
                  <Form.Control>
                    <Input
                      autoComplete="off"
                      {...field}
                      disabled
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            {!isExistingMember && (
              <>
                <Form.Field
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("register.firstName")}</Form.Label>
                      <Form.Control>
                        <Input autoComplete="given-name" {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("register.lastName")}</Form.Label>
                      <Form.Control>
                        <Input autoComplete="family-name" {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </>
            )}
            <Form.Field
              control={form.control}
              name="password"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.password")}</Form.Label>
                  <Form.Control>
                    <Input
                      autoComplete="new-password"
                      type="password"
                      {...field}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            {!isExistingMember && (
              <Form.Field
                control={form.control}
                name="repeat_password"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("fields.repeatPassword")}</Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="off"
                        type="password"
                        {...field}
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />
            )}
            {validationError && (
              <Hint className="inline-flex" variant="error">
                {validationError}
              </Hint>
            )}
            {serverError && (
              <Alert
                className="bg-ui-bg-base items-center p-2"
                dismissible
                variant="error"
              >
                {serverError}
              </Alert>
            )}
          </div>
          <Button
            className="w-full"
            type="submit"
            isLoading={isCreatingAuthUser || isSigningIn || isAcceptingInvite}
            disabled={invalid}
          >
            {t("actions.continue")}
          </Button>
        </form>
      </Form>
      <LoginLink />
    </div>
  );
};

const InviteSchema = z.object({
  id: z.string(),
  jti: z.string(),
  exp: z.number(),
  iat: z.number(),
});

const validateDecodedInvite = (decoded: any): decoded is DecodedInvite => {
  return InviteSchema.safeParse(decoded).success;
};
