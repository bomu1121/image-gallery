import { defineStore } from "pinia";
import storage from "@/utils/storage";
import set from "@/set.js";

const languageMap = {
  "zh-CN": {
    label: "English",
    locale: "en-US",
  },
  "en-US": {
    label: "中文",
    locale: "zh-CN",
  },
};

export const useSystemLang = defineStore("systemLang", {
  state: () => {
    return {
      lang: storage.getSystemLang() || set.lang,
    };
  },
  getters: {
    currentLang: (state) => {
      return languageMap[languageMap[state.lang].locale];
    },
    targetLang: (state) => {
      return languageMap[state.lang];
    },
  },
  actions: {
    switchLang(val) {
      this.lang = val;
      storage.setSystemLang(val);
    },
  },
});
