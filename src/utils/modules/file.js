import dayjs from "dayjs";
import { getFileUrlByFileId } from "@/api";

// 根据url下载文件
export const dwonFileByUrl = (url, fileName) => {
  const link = document.createElement("a"); // 创建a标签
  link.href = url;
  link.download = fileName || dayjs().format("YYYYMMDDHHmmss"); // 重命名文件
  link.click();
  window.URL.revokeObjectURL(url); // 释放内存
};

// 下载文件流
export const downBlob = (data, fileName, type) => {
  const blob = new Blob([data], { type: type || data.type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a"); // 创建a标签
  link.href = url;
  link.download = fileName || dayjs().format("YYYYMMDDHHmmss"); // 重命名文件
  link.click();
  window.URL.revokeObjectURL(url); // 释放内存
};

// 下载base64
export const downBase64 = (base64Str, fileName) => {
  let aLink = document.createElement("a");
  aLink.style.display = "none";
  aLink.href = base64Str;
  aLink.download = fileName || "未命名";
  // 触发点击-然后移除
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
};

// 流转为base64;
export const blobToBase64 = (data, baseHead = "data:image/png;base64,") => {
  return (
    baseHead +
    btoa(
      new Uint8Array(data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    )
  );
};
