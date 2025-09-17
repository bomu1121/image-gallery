/**
 * 图标映射工具
 * 统一管理所有Element Plus图标，避免导入不存在的图标
 */

// 导入所有需要的图标
import {
  // 基础图标
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,

  // 操作图标
  Plus,
  Minus,
  Edit,
  Delete,
  Search,
  Refresh,
  Download,
  Upload,

  // 状态图标
  Check,
  Close,
  Warning,
  InfoFilled,
  SuccessFilled,
  Failed,

  // 界面图标
  Setting,
  View,
  Star,
  Picture,
  Folder,
  Files,
  Document,

  // 导航图标
  Menu,
  More,

  // 其他常用图标
  Calendar,
  Clock,
  Location,
  Phone,
  Message,
  User,
  Lock,
  Unlock,
  Filter,
  Sort,
  Grid,
  List,
} from "@element-plus/icons-vue";

// 图标映射表
export const iconMap = {
  // 基础图标
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,

  // 操作图标
  plus: Plus,
  minus: Minus,
  edit: Edit,
  delete: Delete,
  search: Search,
  refresh: Refresh,
  download: Download,
  upload: Upload,

  // 状态图标
  check: Check,
  close: Close,
  warning: Warning,
  info: InfoFilled,
  success: SuccessFilled,
  error: Failed,

  // 界面图标
  setting: Setting,
  view: View,
  star: Star,
  picture: Picture,
  folder: Folder,
  file: Files,
  document: Document,

  // 导航图标
  menu: Menu,
  more: More,

  // 其他图标
  calendar: Calendar,
  clock: Clock,
  location: Location,
  phone: Phone,
  message: Message,
  user: User,
  lock: Lock,
  unlock: Unlock,
  filter: Filter,
  sort: Sort,
  grid: Grid,
  list: List,
};

/**
 * 获取图标组件
 * @param {string} iconName - 图标名称
 * @returns {Object} Vue组件
 */
export function getIcon(iconName) {
  const icon = iconMap[iconName];
  if (!icon) {
    console.warn(`图标 "${iconName}" 不存在，使用默认图标 "setting"`);
    return iconMap["setting"];
  }
  return icon;
}

/**
 * 检查图标是否存在
 * @param {string} iconName - 图标名称
 * @returns {boolean} 是否存在
 */
export function hasIcon(iconName) {
  return iconName in iconMap;
}

// 导出所有图标（用于直接导入）
export {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Edit,
  Delete,
  Search,
  Refresh,
  Download,
  Upload,
  Check,
  Close,
  Warning,
  InfoFilled,
  SuccessFilled,
  Failed,
  Setting,
  View,
  Star,
  Picture,
  Folder,
  Files,
  Document,
  Menu,
  More,
  Calendar,
  Clock,
  Location,
  Phone,
  Message,
  User,
  Lock,
  Unlock,
  Filter,
  Sort,
  Grid,
  List,
};
