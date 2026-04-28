import { Heading, Input, Text, clx } from "@medusajs/ui";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Form } from "../../../../components/common/form";
import { useTabbedForm } from "../../../../components/tabbed-form/tabbed-form";
import { defineTabMeta } from "../../../../components/tabbed-form/types";
import { useMembers } from "../../../../hooks/api/members";
import { CreateStoreSchemaType } from "./schema";

type Member = { id: string; email: string };

const Root = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<CreateStoreSchemaType>();

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  const emailValue = useWatch({
    control: form.control,
    name: "member_email",
  });

  const { members } = useMembers(
    { q: emailValue || undefined, limit: 10 },
    { placeholderData: (prev: any) => prev },
  );

  const memberList = useMemo(
    () => (members as Member[] | undefined) ?? [],
    [members],
  );

  useEffect(() => {
    if (!suggestionsOpen) return;

    const update = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: `calc(100vh - ${rect.bottom + 24}px)`,
        overflowY: "auto",
      });
    };

    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [suggestionsOpen]);

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-3">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-px py-16">
        <div>
          <Heading>{t("stores.create.usersHeader")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("stores.create.usersHint")}
          </Text>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t("stores.create.usersHintSecondary")}
          </Text>
        </div>
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="member_email"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.email")}</Form.Label>
                <Form.Control>
                  <div ref={wrapperRef} className="relative">
                    <Input
                      {...field}
                      autoComplete="off"
                      placeholder="admin@example.com"
                      onFocus={() => setSuggestionsOpen(true)}
                      onBlur={() => {
                        field.onBlur();
                        setTimeout(() => setSuggestionsOpen(false), 150);
                      }}
                    />
                    {suggestionsOpen &&
                      memberList.length > 0 &&
                      createPortal(
                        <div
                          style={dropdownStyle}
                          className={clx(
                            "bg-ui-bg-base shadow-elevation-flyout border-ui-border-base z-50 flex flex-col rounded-md border p-1",
                          )}
                        >
                          {memberList.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                field.onChange(member.email);
                                setSuggestionsOpen(false);
                              }}
                              className="hover:bg-ui-bg-base-hover text-ui-fg-base flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm"
                            >
                              {member.email}
                            </button>
                          ))}
                        </div>,
                        document.body,
                      )}
                  </div>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
};

Root._tabMeta = defineTabMeta<CreateStoreSchemaType>({
  id: "users",
  labelKey: "stores.create.tabs.users",
});

export const StoreCreateUsersTab = Root;
