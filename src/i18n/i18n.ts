import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { getProfile } from "../storage/profile";
import { AppLang, translations } from "./translations";

export const i18n = new I18n(translations);

// defaults
i18n.enableFallback = true;
i18n.defaultLocale = "en";

// Choose best device locale (if supported)
const deviceLang = (Localization.getLocales()?.[0]?.languageCode ||
  "en") as AppLang;
i18n.locale = ["en", "hi", "te", "ta"].includes(deviceLang) ? deviceLang : "en";

export const t = (key: string, options?: any) => i18n.t(key, options);

// Call this when user changes language in Profile
export const setLocale = (lang: AppLang) => {
  i18n.locale = lang;
};

// Load saved language from profile on startup (call once in RootLayout)
export const initLocaleFromStorage = async () => {
  try {
    const p = await getProfile();
    if (p?.language) setLocale(p.language);
  } catch {}
};
