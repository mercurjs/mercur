import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { defaultI18nOptions } from "../../../i18n/config";
import translations from "../../../i18n/translations";
import customI18nResources from "virtual:mercur/i18n";
import config from "virtual:mercur/config";

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

const mergedTranslations = deepMerge(translations, customI18nResources);

export const I18n = () => {
  if (i18n.isInitialized) {
    return null;
  }

  i18n
    .use(
      new LanguageDetector(null, {
        lookupCookie: "lng",
        lookupLocalStorage: "lng",
      }),
    )
    .use(initReactI18next)
    .init({
      ...defaultI18nOptions,
      ...(config.i18n?.defaultLanguage && {
        lng: config.i18n.defaultLanguage,
      }),
      resources: mergedTranslations,
    });

  return null;
};

export { i18n };
