// 浏览器缓存配置
const defaultConfig = {
  SystemLang: ["SYSTEM_LANG", "l"],
};

const code = import.meta.env.VITE_APP_STORAGE_CODE;

const storage = {};

const defaultCatchFactory = (config) => {
  for (const key in config) {
    const itemKey = `${code}_${config[key][0]}`;
    const type = config[key][1];
    if (type === "l") {
      storage["get" + key] = () => {
        const cache = localStorage.getItem(itemKey);
        return cache && cache !== "undefined" ? JSON.parse(cache) : null;
      };
      storage["set" + key] = (v) => {
        if (v) localStorage.setItem(itemKey, JSON.stringify(v));
      };

      storage["remove" + key] = () => localStorage.removeItem(itemKey);
    } else if (type === "s") {
      storage["get" + key] = () => {
        const cache = sessionStorage.getItem(itemKey);
        return cache && cache !== "undefined" ? JSON.parse(cache) : null;
      };
      storage["set" + key] = (v) => {
        if (v) sessionStorage.setItem(itemKey, JSON.stringify(v));
      };

      storage["remove" + key] = () => sessionStorage.removeItem(itemKey);
    }
  }
};

defaultCatchFactory(defaultConfig);

export default storage;
