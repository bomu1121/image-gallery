/**重置message，防止重复点击重复弹出message弹框 */
import { ElMessage } from "element-plus";
let messageInstance = null;
const CusMessage = (options) => {
  if (messageInstance) {
    messageInstance.close();
  }
  messageInstance = ElMessage(options);
};

["error", "success", "info", "warning"].forEach((type) => {
  CusMessage[type] = (options) => {
    if (typeof options === "string") {
      options = {
        message: options,
      };
    }
    options.type = type;
    return CusMessage(options);
  };
});

export default CusMessage;
