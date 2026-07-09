import { GlobeEurope } from "@medusajs/icons";
import { DropdownMenu } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useDocumentDirection } from "../../../hooks/use-document-direction";
import { languages } from "../../../i18n/languages";

export const AuthLanguageSelect = () => {
  const { t, i18n } = useTranslation();
  const direction = useDocumentDirection();

  const sortedLanguages = [...languages].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );

  const currentLanguage = sortedLanguages.find(
    (language) => language.code === i18n.language
  );

  return (
    <DropdownMenu dir={direction}>
      <DropdownMenu.Trigger
        className="text-ui-fg-subtle hover:bg-ui-bg-subtle-hover focus-visible:shadow-borders-focus flex items-center gap-x-2 rounded-md px-2 py-1 outline-none transition-fg"
        data-testid="auth-language-select-trigger"
      >
        <GlobeEurope />
        <span className="txt-compact-small">
          {currentLanguage?.display_name ?? t("profile.fields.languageLabel")}
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        className="max-h-[300px] overflow-y-auto"
      >
        <DropdownMenu.RadioGroup value={i18n.language}>
          {sortedLanguages.map((language) => (
            <DropdownMenu.RadioItem
              key={language.code}
              value={language.code}
              onClick={(e) => {
                e.preventDefault();
                i18n.changeLanguage(language.code);
              }}
              data-testid={`auth-language-select-option-${language.code}`}
            >
              {language.display_name}
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
