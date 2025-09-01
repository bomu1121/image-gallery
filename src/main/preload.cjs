// Basic preload exposing minimal API (kept empty for now for security)
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // placeholder for future APIs
});
