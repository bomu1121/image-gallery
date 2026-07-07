import { cloneDeep } from "lodash";

const allEnum = {
  // 示例
  // websiteStatus: [
  //   { label: "启用", value: 1 },
  //   { label: "禁用", value: 0 },
  // ],
};

const listToMap = (list, key = "value", value = "label", group = false) => {
  return list.reduce((prev, item) => {
    if (!group) prev[item[key]] = item[value];
    else prev[item[key]] = item;
    return prev;
  }, {});
};

const listToMapGroup = (list, key = "value", value = "label") => {
  return listToMap(list, (key = "value"), (value = "label"), true);
};

export const getEnum = (name) => {
  return cloneDeep(allEnum[name] || []);
};

export const getEnumMap = (name) => {
  return listToMap(getEnum(name));
};

export const getEnumMapGroup = (name) => {
  return listToMapGroup(getEnum(name));
};
