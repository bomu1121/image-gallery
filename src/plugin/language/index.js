import { createI18n } from "vue-i18n";
import set from "@/set.js";
import storage from "@/utils/storage";
import zhCN from "./zh_CN";
import enUS from "./en_US";

export const messages = {
  "zh-CN": { ...zhCN, loacl: "zh-CN", localName: "简体中文" },
  "en-US": { ...enUS, local: "en-US", localName: "English" },
};

const i18n = new createI18n({
  locale: storage.getSystemLang() || set.lang, // 指定当前的语言包
  messages,
  legacy: false,
  allowComposition: true,
  silentTranslationWarn: true, // 去除国际化警告
});

export default i18n;

/**
 * 使用示例
 * template
 * 1. $t('lang.col1')
 *
 * js
 * const { proxy } = getCurrentInstance();;
 * proxy.$t("loginView.accountLogin")
 */
