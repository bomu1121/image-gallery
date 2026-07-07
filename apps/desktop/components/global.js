const list = [];

export const setGlobalComponents = (app) => {
  for (const item of list) {
    const { name } = item;
    if (name) app.component(name, item);
  }
};
