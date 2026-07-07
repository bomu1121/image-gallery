import dayjs from "dayjs";

/**
 * 获取数组嵌套层级
 * @param {*} arr
 * @returns
 */
export const getArrayDepth = (arr, key) => {
  let depth = 0;

  function checkArray(currentArray, currentDepth) {
    currentDepth++;
    depth = Math.max(depth, currentDepth);
    currentArray.forEach((item) => {
      if (!key) {
        if (Array.isArray(item)) {
          checkArray(item, currentDepth);
        }
      } else {
        if (Array.isArray(item[key])) {
          checkArray(item[key], currentDepth);
        }
      }
    });
  }

  checkArray(arr, depth);
  return depth;
};

/**
 * 时间范围数组转map
 * @param {Array} dateFrame 拥有开始结束时间的数组
 * @param {String} startKey 开始时间的key
 * @param {String} endKey 结束时间的key
 * @returns
 */
export const getDateFrameMap = (
  dateFrame,
  startKey = "startTime",
  endKey = "endTime"
) => {
  const map = {};
  if (dateFrame[0] && dateFrame[1]) {
    map[startKey] = dayjs(dateFrame[0]).format("YYYY-MM-DD 00:00:00");
    map[endKey] = dayjs(dateFrame[1]).format("YYYY-MM-DD 23:59:59");
  }
  return map;
};
