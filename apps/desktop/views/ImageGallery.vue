<template>
  <div class="gallery-page">
    <!-- 鍙姌鍙犺彍鍗曟爮 -->
    <div class="collapsible-menu-bar">
      <div class="menu-header" @click="toggleMenu">
        <div class="menu-title">
          <el-icon><icon-menu /></el-icon>
        </div>
        <div class="menu-toggle" :class="{ 'is-collapsed': isMenuCollapsed }">
          <el-icon><icon-arrow-down /></el-icon>
        </div>
      </div>

      <div class="menu-content" :class="{ 'is-collapsed': isMenuCollapsed }">
        <div class="menu-actions">
          <div
            class="menu-action-item"
            :class="{ active: uploadMode }"
            @click="toggleUploadMode"
            title=""
          >
            <el-icon><icon-plus /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: batchDeleteMode }"
            @click="startBatchDelete"
            title=""
          >
            <el-icon><icon-delete /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: showGroupSelector }"
            @click="onToggleGroupSelector"
            title=""
          >
            <el-icon><icon-folder /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: showSearchArea }"
            @click="onToggleSearchArea"
            title=""
          >
            <el-icon><icon-search /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: albumMode }"
            @click="onStartAlbumMode"
            title=""
          >
            <img
              src="/src/static/images/icons/group.png"
              alt=""
              class="album-icon"
            />
          </div>
        </div>

        <!-- 鍒嗙粍閫夋嫨鍖哄煙 -->
        <div v-if="showGroupSelector" class="group-selector slide-down-panel">
          <div class="group-tabs">
            <!-- 鏂板缓鍒嗙粍鎸夐挳 -->
            <div class="group-tab create-group-tab" @click="showCreateGroup">
              <el-icon><icon-plus /></el-icon>
            </div>

            <!-- 鍒嗙粍璁剧疆鎸夐挳 -->
            <div
              class="group-tab settings-group-tab"
              @click="showGroupManage"
              title=""
            >
              <el-icon><icon-setting /></el-icon>
            </div>

            <!-- 鍒嗙粍鏍囩 -->
            <div
              v-for="group in groups"
              :key="group.id"
              class="group-tab"
              :class="{ active: selectedGroupId === group.id }"
              @click="selectGroup(group.id)"
            >
              <span class="group-name">{{ group.name }}</span>
              <span class="group-count">({{ group.imageCount }})</span>
            </div>
          </div>
        </div>

        <!-- 涓婁紶鍖哄煙 -->
        <div v-if="uploadMode" class="upload-area slide-down-panel">
          <el-upload
            class="uploader"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="onFileChange"
          >
            <el-icon class="el-icon--upload"><icon-plus /></el-icon>
            <div class="el-upload__text">鎷栨嫿鍥剧墖鍒版澶勶紝鎴栫偣鍑婚€夋嫨</div>
            <!-- <div class="el-upload__tip">鏀寔 Ctrl+V 绮樿创鍥剧墖</div> -->
          </el-upload>
        </div>

        <!-- 鎵归噺鍒犻櫎/缁勫浘妯″紡鎿嶄綔锛堝叡鐢ㄩ潰鏉匡紝浜掓枼鏄剧ず锛?-->
        <div
          v-if="batchDeleteMode || albumMode"
          class="menu-batch-bar slide-down-panel"
        >
          <div class="batch-info">
            <span class="selected-count"
              >宸查€夋嫨 {{ selectedImages.size }} 寮犲浘鐗?/span
            >
          </div>
          <div class="batch-actions">
            <el-button
              @click="selectAll"
              :disabled="selectedImages.size === images.length"
              class="gray-button"
              >鍏ㄩ€?/el-button
            >
            <el-button
              @click="clearAll"
              :disabled="selectedImages.size === 0"
              class="gray-button"
              >鍙栨秷閫夋嫨</el-button
            >
            <template v-if="batchDeleteMode">
              <el-button
                @click="confirmBatchDelete"
                :disabled="selectedImages.size === 0"
                class="batch-delete-icon-button"
                circle
              >
                <el-icon><icon-delete /></el-icon>
              </el-button>
            </template>
            <template v-else>
              <el-button
                type="primary"
                :disabled="selectedImages.size === 0"
                @click="emit('createAlbumFromSelection')"
              >
                娣诲姞鍒扮粍鍥?
              </el-button>
            </template>
          </div>
        </div>

        <!-- 鎼滅储鍖哄煙 -->
        <div v-if="showSearchArea" class="search-area slide-down-panel">
          <div class="search-form">
            <div class="search-field">
              <el-input
                v-model="searchName"
                placeholder=""
                clearable
                @input="onSearchChange"
                @clear="onSearchChange"
              />
            </div>
            <div class="search-field">
              <div class="tags-container">
                <div class="tags-display">
                  <!-- 鐜版湁鎼滅储鏍囩 -->
                  <div
                    v-for="tag in searchTags"
                    :key="tag"
                    class="tag-item"
                    @click="removeTag(tag)"
                  >
                    {{ tag }}
                    <el-icon class="tag-remove"><icon-delete /></el-icon>
                  </div>

                  <!-- 娣诲姞鏍囩鎸夐挳 -->
                  <div
                    v-if="!isAddingSearchTag"
                    class="add-tag-button"
                    @click="startAddingSearchTag"
                  >
                    <el-icon><icon-plus /></el-icon>
                  </div>

                  <!-- 鎻愮ず鏂囧瓧锛堝綋娌℃湁鏍囩鏃舵樉绀猴級 -->
                  <div
                    v-if="searchTags.length === 0 && !isAddingSearchTag"
                    class="tag-hint-text"
                  >
                    鎸夋爣绛炬悳绱?
                  </div>

                  <!-- 姝ｅ湪娣诲姞鐨勬爣绛捐緭鍏ユ -->
                  <div
                    v-if="isAddingSearchTag"
                    class="tag-item adding-tag"
                    :style="{ width: searchTagInputWidth + 'px' }"
                  >
                    <input
                      v-model="newSearchTagInput"
                      ref="searchTagInput"
                      class="tag-input-field"
                      placeholder=""
                      @keyup.enter="confirmAddSearchTag"
                      @keyup.escape="cancelAddSearchTag"
                      @blur="confirmAddSearchTag"
                      @input="adjustSearchTagInputWidth"
                    />
                  </div>
                </div>
              </div>
            </div>
            <!-- 鏆傛椂闅愯棌娓呯┖鎼滅储鎸夐挳鍖哄煙 -->
            <!-- <div class="search-actions">
              <el-button @click="clearSearch" size="small">娓呯┖鎼滅储</el-button>
            </div> -->
          </div>
        </div>
      </div>
    </div>

    <div class="gallery-scroll">
      <div v-if="!images.length" class="empty">
        <!-- <div class="empty-content">
          <div class="empty-icon">馃摲</div>
          <div class="empty-text">鏆傛棤鍥剧墖锛岃鍏堜笂浼?/div>
          <div class="empty-tip">鏀寔鎷栨嫿涓婁紶銆佺偣鍑讳笂浼犳垨 Ctrl+V 绮樿创鍥剧墖</div>
        </div> -->
      </div>

      <div class="grid" :style="gridStyle" v-else>
        <div
          v-for="img in images"
          :key="img.id"
          class="card"
          :class="{
            'is-deleting': isDeleting(img.id),
            'is-selected':
              (batchDeleteMode || albumMode) && selectedImages.has(img.id),
            'is-main-image': albumMode && isMainImage(img.id),
          }"
        >
          <img
            :src="img.objectUrl || img.url"
            :alt="img.name"
            @click="onCardClick(img)"
            @contextmenu.prevent="
              !batchDeleteMode && onCardContextMenu($event, img)
            "
          />
          <div v-if="coverCounts[img.id] > 0" class="album-count-badge">
            +{{ coverCounts[img.id] }}
          </div>

          <div v-if="isDeleting(img.id)" class="deleting-overlay">
            <div class="spinner" />
          </div>
          <!-- 閫変腑鐘舵€侀伄缃?-->
          <div
            v-if="(batchDeleteMode || albumMode) && selectedImages.has(img.id)"
            class="selection-overlay"
            @click="onCardClick(img)"
          >
            <div class="check-icon">
              <el-icon><icon-check /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 鍙抽敭鑿滃崟 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click="hideContextMenu"
    >
      <div
        class="context-menu-item"
        @click="copyImageToClipboard(contextMenuImage)"
      >
        <el-icon><icon-copy /></el-icon>
        <span>澶嶅埗</span>
      </div>
      <div class="context-menu-item" @click="downloadImage(contextMenuImage)">
        <el-icon><icon-download /></el-icon>
        <span>涓嬭浇</span>
      </div>
      <div class="context-menu-item" @click="showGroupMenu(contextMenuImage)">
        <el-icon><icon-folder /></el-icon>
        <span>鍒嗙粍</span>
      </div>
      <div
        class="context-menu-item"
        @click="addToAlbumFromContext(contextMenuImage)"
      >
        <el-icon><icon-plus /></el-icon>
        <span>鏂板缁勫浘</span>
      </div>
      <div
        v-if="isContextMenuImageGroup"
        class="context-menu-item"
        @click="restoreGroupFromContext(contextMenuImage)"
      >
        <el-icon><icon-setting /></el-icon>
        <span>缁勫浘杩樺師</span>
      </div>
      <div class="context-menu-divider"></div>
      <div
        class="context-menu-item"
        @click="deleteImageFromContext(contextMenuImage)"
      >
        <el-icon><icon-delete /></el-icon>
        <span>鍒犻櫎</span>
      </div>
    </div>

    <!-- 棰勮瀵硅瘽妗?-->
    <el-dialog
      v-model="viewerVisible"
      :title=""
      width="70%"
    >
      <div class="viewer">
        <img
          v-if="current"
          :src="current.objectUrl || current.url"
          :alt="current.name"
        />
      </div>
    </el-dialog>

    <!-- 鑷畾涔夌‘璁ゅ垹闄ゅ璇濇 -->
    <CustomDialog
      :visible="dialogVisible"
      :title="dialogConfig.title"
      :message="dialogConfig.message"
      :type="dialogConfig.type"
      :show-cancel-button="dialogConfig.showCancelButton"
      :confirm-button-text="dialogConfig.confirmButtonText"
      :cancel-button-text="dialogConfig.cancelButtonText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import {
  ElButton,
  ElIcon,
  ElEmpty,
  ElDialog,
  ElUpload,
  // ElMessageBox,
} from "element-plus";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
import { useConfirmDelete } from "@/composables/useConfirmDelete.js";
import CustomDialog from "@/components/CustomDialog.vue";
import {
  Delete as IconDelete,
  CopyDocument as IconCopy,
  Download as IconDownload,
  Folder as IconFolder,
  Check as IconCheck,
  Menu as IconMenu,
  ArrowDown as IconArrowDown,
  Upload as IconUpload,
  Plus as IconPlus,
  Setting as IconSetting,
  Search as IconSearch,
} from "@element-plus/icons-vue";
import {
  getAllImages,
  deleteImageToTrash,
  getChildrenImages,
  restoreGroupToIndividualImages,
} from "@/utils/idb.js";

// Props
const props = defineProps({
  batchDeleteMode: {
    type: Boolean,
    default: false,
  },
  selectedImages: {
    type: Set,
    default: () => new Set(),
  },
  albumMode: {
    type: Boolean,
    default: false,
  },
  groups: {
    type: Array,
    default: () => [],
  },
  selectedGroupId: {
    type: Number,
    default: 0,
  },
  showGroupSelector: {
    type: Boolean,
    default: false,
  },
  uploadMode: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([
  "toggleImageSelection",
  "clearSelection",
  "batchDelete",
  "startBatchDelete",
  "showGroupSelector",
  "selectGroup",
  "showCreateGroup",
  "showGroupManage",
  "toggleUploadMode",
  "fileChange",
  "startAlbumMode",
  "createAlbumFromSelection",
]);

const router = useRouter();
const { success, error, warning, info } = useDrawerNotification();
const { dialogVisible, dialogConfig, deleteConfirm } = useConfirmDelete();

const images = ref([]);
const coverCounts = ref({}); // { [imageId]: number }
const hiddenImageIds = ref(new Set()); // 闇€瑕佸湪涓诲垪琛ㄩ殣钘忕殑鍥剧墖锛堢浉鍐屽唴闈炲皝闈級
// 绉婚櫎灏忓崱灞曞紑鎵€闇€鐨勬湰鍦扮姸鎬?
const viewerVisible = ref(false);
const current = ref(null);
const deletingIds = ref([]);
const MIN_DELETE_MS = 800; // 璋冭瘯鐢ㄦ渶灏忓睍绀烘椂闀?

// 鍒楁暟璁剧疆
const columnCount = ref(3); // 榛樿涓夊垪

// 鍙栨秷鍙鏁伴噺闄愬埗锛屾敼涓哄畬鏁村睍绀猴紙缁撳悎鏍峰紡鍋氭崲琛?甯冨眬锛?

// 鑿滃崟鏍忕姸鎬?
const isMenuCollapsed = ref(false);

// 鎼滅储鐩稿叧鐘舵€?
const showSearchArea = ref(false);
const searchName = ref("");
const searchTagsInput = ref("");
const searchTags = ref([]);
const isSearchActive = ref(false);
const originalImages = ref([]); // 淇濆瓨鍘熷鍥剧墖鍒楄〃锛岀敤浜庢悳绱㈠悗鎭㈠

// 鎼滅储鏍囩娣诲姞鐩稿叧鐘舵€?
const isAddingSearchTag = ref(false);
const newSearchTagInput = ref("");
const searchTagInput = ref(null);
const searchTagInputWidth = ref(80); // 榛樿鏈€灏忓搴?

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withMinDuration(taskPromise, minMs) {
  const startedAt = Date.now();
  const result = await taskPromise;
  const elapsed = Date.now() - startedAt;
  if (elapsed < minMs) await sleep(minMs - elapsed);
  return result;
}

function isDeleting(id) {
  return deletingIds.value.includes(id);
}

// 鍒ゆ柇鏄惁涓虹粍鍥炬ā寮忎笅鐨勪富鍥撅紙绗竴涓€変腑鐨勫浘鐗囷級
function isMainImage(id) {
  if (!props.albumMode || props.selectedImages.size === 0) return false;
  const selectedArray = Array.from(props.selectedImages);
  return selectedArray.length > 0 && selectedArray[0] === id;
}

// 鍒ゆ柇鍥剧墖鏄惁鍙互琚€夋嫨锛堢粍鍥炬ā寮忎笅鐨勯€夋嫨闄愬埗锛?
function canSelectImage(id) {
  if (!props.albumMode) return true;

  const selectedArray = Array.from(props.selectedImages);

  // 濡傛灉杩樻病鏈夐€夋嫨浠讳綍鍥剧墖锛屽彲浠ラ€夋嫨浠讳綍鍥剧墖锛堝寘鎷粍鍥撅級
  if (selectedArray.length === 0) {
    return true;
  }

  // 濡傛灉宸茬粡閫夋嫨浜嗗浘鐗囷紝鍚庣画鍙兘閫夋嫨鐙珛鍥剧墖锛堥潪缁勫浘锛?
  const img = images.value.find((img) => img.id === id);
  if (!img) return false;

  // 妫€鏌ユ槸鍚︿负鐙珛鍥剧墖锛堟病鏈夐檮鍥剧殑涓诲浘锛?
  return coverCounts.value[id] === undefined || coverCounts.value[id] === 0;
}

function startDeleting(id) {
  if (!isDeleting(id)) deletingIds.value.push(id);
}

function stopDeleting(id) {
  deletingIds.value = deletingIds.value.filter((x) => x !== id);
}

// 鍙抽敭鑿滃崟鐩稿叧
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuImage = ref(null);
const isContextMenuImageGroup = ref(false);

function revokeObjectUrls(list) {
  list?.forEach((it) => {
    if (it && it.objectUrl) {
      URL.revokeObjectURL(it.objectUrl);
    }
  });
}

async function load() {
  const prev = images.value;
  const data = await getAllImages();
  revokeObjectUrls(prev);

  // 鏍规嵁閫変腑鐨勫垎缁勭瓫閫夊浘鐗?
  let filteredData = data;
  if (props.selectedGroupId !== null && props.selectedGroupId !== undefined) {
    if (props.selectedGroupId === -1) {
      // ""鍒嗙粍锛氭樉绀烘墍鏈夊浘鐗?
      filteredData = data;
    } else {
      // 鍏朵粬鍒嗙粍锛氳繃婊ゅ嚭鎸囧畾鍒嗙粍鐨勫浘鐗?
      filteredData = data.filter(
        (img) => (img.groupId || 0) === props.selectedGroupId
      );
    }
  }

  // 鍩轰簬 parentImageId 缁熻锛氶檮鍥鹃殣钘忥紝涓诲浘鏄剧ず +N
  const newCoverCounts = {};
  const newHidden = new Set();
  for (const img of filteredData) {
    if (img.parentImageId !== null && img.parentImageId !== undefined) {
      newHidden.add(img.id);
      const pid = img.parentImageId;
      newCoverCounts[pid] = (newCoverCounts[pid] || 0) + 1;
    }
  }
  coverCounts.value = newCoverCounts;
  hiddenImageIds.value = newHidden;

  // 浠呮樉绀轰富鍥?
  const visibleData = filteredData.filter(
    (r) => r.parentImageId === null || r.parentImageId === undefined
  );

  images.value = visibleData.map((r) => ({
    ...r,
    objectUrl:
      r.blob && r.blob instanceof Blob ? URL.createObjectURL(r.blob) : r.url,
  }));

  // 濡傛灉褰撳墠澶勪簬鎼滅储鐘舵€侊紝鍒欏熀浜庢柊鐨勫垎缁勬暟鎹噸鏂板簲鐢ㄦ悳绱㈡潯浠?
  if (isSearchActive.value) {
    originalImages.value = [...images.value];
    performRealtimeSearch();
  }
}

onMounted(() => {
  // 璁╁嚭涓€娆℃覆鏌撴椂鏈猴紝浼樺厛缁樺埗渚ц竟鏍忛€変腑鎬侊紝鍐嶅紑濮嬪姞杞?
  setTimeout(() => {
    load();
  }, 0);
  // 娣诲姞鍏ㄥ眬鐐瑰嚮浜嬩欢鐩戝惉锛岀偣鍑诲叾浠栧湴鏂归殣钘忓彸閿彍鍗?
  document.addEventListener("click", hideContextMenu);
  // 娣诲姞婊氬姩浜嬩欢鐩戝惉锛屾粴鍔ㄦ椂闅愯棌鍙抽敭鑿滃崟
  document.addEventListener("scroll", hideContextMenu, true);
  // 鐩戝惉涓婁紶瀹屾垚浜嬩欢锛屽埛鏂板垪琛?
  window.addEventListener("imageAdded", load);

  // 鐩戝惉鍒楁暟鍙樺寲浜嬩欢
  window.addEventListener("columnCountChanged", handleColumnCountChanged);

  // 鍒濆鍖栧垪鏁拌缃?
  initializeColumnCount();
});

// 鐩戝惉鍒嗙粍鍙樺寲锛岄噸鏂板姞杞藉浘鐗?
watch(
  () => props.selectedGroupId,
  () => {
    load();
  }
);

onBeforeUnmount(() => {
  revokeObjectUrls(images.value);
  document.removeEventListener("click", hideContextMenu);
  document.removeEventListener("scroll", hideContextMenu, true);
  window.removeEventListener("imageAdded", load);
  window.removeEventListener("columnCountChanged", handleColumnCountChanged);
});

async function remove(id) {
  if (isDeleting(id)) return;
  startDeleting(id);
  try {
    console.time(`delete-image-${id}`);
    await withMinDuration(deleteImageToTrash(id), MIN_DELETE_MS);
    console.timeEnd(`delete-image-${id}`);
    await load();
    // 閫氱煡涓婂眰鍚屾鍒嗙粍璁℃暟绛夋淳鐢熸暟鎹?
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } finally {
    stopDeleting(id);
  }
}

function openViewer(img) {
  current.value = img;
  viewerVisible.value = true;
}

function goToDetail(img) {
  router.push(`/image/${img.id}`);
}

function onCardClick(img) {
  if (isDeleting(img.id)) return;

  if (props.batchDeleteMode || props.albumMode) {
    // 鎵归噺鍒犻櫎 / 缁勫浘妯″紡 涓嬶紝鍒囨崲閫変腑鐘舵€?
    // 鍦ㄧ粍鍥炬ā寮忎笅锛岄渶瑕佹鏌ラ€夋嫨闄愬埗
    if (props.albumMode && !canSelectImage(img.id)) {
      return;
    }
    emit("toggleImageSelection", img.id);
  } else {
    // 姝ｅ父妯″紡涓嬶紝璺宠浆鍒拌鎯呴〉
    goToDetail(img);
  }
}

// 鍙抽敭鑿滃崟鐩稿叧鍑芥暟
async function showContextMenu(event, img) {
  event.preventDefault();
  contextMenuImage.value = img;

  // 妫€鏌ユ槸鍚︿负缁勫浘
  try {
    const children = await getChildrenImages(img.id);
    isContextMenuImageGroup.value = children.length > 0;
  } catch (err) {
    console.error("", err);
    isContextMenuImageGroup.value = false;
  }

  // 鍏堟樉绀鸿彍鍗曚互鑾峰彇瀹為檯灏哄
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;

  // 浣跨敤 nextTick 纭繚鑿滃崟宸叉覆鏌擄紝鐒跺悗璋冩暣浣嶇疆
  nextTick(() => {
    adjustContextMenuPosition(event.clientX, event.clientY);
  });
}

// 璋冩暣鍙抽敭鑿滃崟浣嶇疆鐨勫嚱鏁?
function adjustContextMenuPosition(originalX, originalY) {
  const menuElement = document.querySelector(".context-menu");
  if (!menuElement) return;

  const menuRect = menuElement.getBoundingClientRect();
  const menuWidth = menuRect.width;
  const menuHeight = menuRect.height;
  const padding = 10; // 璺濈灞忓箷杈圭紭鐨勬渶灏忚窛绂?

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = originalX;
  let y = originalY;

  // 姘村钩鏂瑰悜锛氬鏋滀細瓒呭嚭鍙宠竟鐣岋紝鍒欒创鍙宠竟鐣?
  if (x + menuWidth + padding > viewportWidth) {
    x = viewportWidth - menuWidth - padding;
  }

  // 鍨傜洿鏂瑰悜锛氬鏋滀細瓒呭嚭涓嬭竟鐣岋紝鍒欒创涓嬭竟鐣?
  if (y + menuHeight + padding > viewportHeight) {
    y = viewportHeight - menuHeight - padding;
  }

  // 纭繚涓嶈秴鍑哄乏杈圭晫鍜屼笂杈圭晫
  x = Math.max(padding, x);
  y = Math.max(padding, y);

  // 鏇存柊鑿滃崟浣嶇疆
  contextMenuX.value = x;
  contextMenuY.value = y;
}

function onCardContextMenu(event, img) {
  if (isDeleting(img.id)) return;
  showContextMenu(event, img);
}

function hideContextMenu() {
  contextMenuVisible.value = false;
  contextMenuImage.value = null;
  isContextMenuImageGroup.value = false;
}

async function copyImageToClipboard(img) {
  if (!img) return;

  try {
    console.log("", img.name);

    // 鑾峰彇鍥剧墖鐨刡lob鏁版嵁
    let imageBlob;
    if (img.blob) {
      imageBlob = img.blob;
      console.log(
        "",
        imageBlob.size,
        "",
        imageBlob.type
      );
    } else if (img.objectUrl) {
      // 濡傛灉鍙湁objectUrl锛岄渶瑕佸厛鑾峰彇blob
      console.log("");
      const response = await fetch(img.objectUrl);
      imageBlob = await response.blob();
      console.log(
        "",
        imageBlob.size,
        "",
        imageBlob.type
      );
    } else {
      error("");
      return;
    }

    // 纭繚blob鏈夋纭殑MIME绫诲瀷
    if (!imageBlob.type || imageBlob.type === "application/octet-stream") {
      console.log("");
      // 鏍规嵁鏂囦欢鎵╁睍鍚嶆帹鏂璏IME绫诲瀷
      const fileName = img.name || "image";
      if (fileName.toLowerCase().includes(".png")) {
        imageBlob = new Blob([imageBlob], { type: "image/png" });
      } else if (
        fileName.toLowerCase().includes(".jpg") ||
        fileName.toLowerCase().includes(".jpeg")
      ) {
        imageBlob = new Blob([imageBlob], { type: "image/jpeg" });
      } else if (fileName.toLowerCase().includes(".gif")) {
        imageBlob = new Blob([imageBlob], { type: "image/gif" });
      } else if (fileName.toLowerCase().includes(".webp")) {
        imageBlob = new Blob([imageBlob], { type: "image/webp" });
      } else {
        // 榛樿涓篜NG
        imageBlob = new Blob([imageBlob], { type: "image/png" });
      }
      console.log("", imageBlob.type);
    }

    // 鍏堝皾璇曟竻绌哄壀璐存澘
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText("");
        console.log("");
        // 绛夊緟涓€灏忔鏃堕棿纭繚娓呯┖鎿嶄綔瀹屾垚
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (clearError) {
      console.warn("", clearError);
    }

    // 鏂规硶1锛氫紭鍏堜娇鐢ㄧ幇浠ｅ壀璐存澘API锛堥渶瑕佽浆鎹负PNG锛?
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        console.log("");

        // 鐜颁唬鍓创鏉緼PI涓昏鏀寔PNG鏍煎紡锛岄渶瑕佽浆鎹?
        let clipboardBlob = imageBlob;
        if (imageBlob.type === "image/jpeg" || imageBlob.type === "image/jpg") {
          console.log("");
          // 鍒涘缓canvas鏉ヨ浆鎹PEG涓篜NG
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          const tempImg = document.createElement("img");

          tempImg.src =
            imageBlob instanceof Blob
              ? URL.createObjectURL(imageBlob)
              : imageBlob;
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            setTimeout(() => reject(new Error("")), 5000);
          });

          tempCanvas.width = tempImg.naturalWidth;
          tempCanvas.height = tempImg.naturalHeight;
          tempCtx.drawImage(tempImg, 0, 0);

          clipboardBlob = await new Promise((resolve, reject) => {
            tempCanvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error(""));
              }
            }, "image/png");
          });

          URL.revokeObjectURL(tempImg.src);
          console.log("", clipboardBlob.size);
        }

        const clipboardItem = new ClipboardItem({
          [clipboardBlob.type]: clipboardBlob,
        });
        await navigator.clipboard.write([clipboardItem]);

        // 楠岃瘉澶嶅埗鏄惁鎴愬姛
        try {
          const clipboardItems = await navigator.clipboard.read();
          console.log("", clipboardItems.length);
          if (clipboardItems.length > 0) {
            const item = clipboardItems[0];
            const types = item.types;
            console.log("", types);
            success("");
            hideContextMenu();
            return;
          }
        } catch (verifyError) {
          console.warn("", verifyError);
          // 鍗充娇楠岃瘉澶辫触锛屼篃鍙兘澶嶅埗鎴愬姛浜?
          success("");
          hideContextMenu();
          return;
        }
      } catch (clipboardError) {
        console.warn("", clipboardError);
        // 缁х画灏濊瘯鍏朵粬鏂规硶
      }
    }

    // 鏂规硶2锛氫娇鐢–anvas + 鐜颁唬鍓创鏉緼PI
    console.log("");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 鍒涘缓涓€涓复鏃剁殑闅愯棌鍥剧墖鍏冪礌鐢ㄤ簬缁樺埗鍒癱anvas
    const tempImg = document.createElement("img");
    tempImg.style.position = "absolute";
    tempImg.style.left = "-9999px";
    tempImg.style.top = "-9999px";
    tempImg.style.width = "1px";
    tempImg.style.height = "1px";
    tempImg.src =
      imageBlob instanceof Blob ? URL.createObjectURL(imageBlob) : imageBlob;
    document.body.appendChild(tempImg);

    // 绛夊緟鍥剧墖鍔犺浇瀹屾垚
    await new Promise((resolve, reject) => {
      tempImg.onload = resolve;
      tempImg.onerror = reject;
      setTimeout(() => reject(new Error("")), 5000);
    });

    canvas.width = tempImg.naturalWidth;
    canvas.height = tempImg.naturalHeight;
    ctx.drawImage(tempImg, 0, 0);
    console.log("", canvas.width, "x", canvas.height);

    try {
      // 灏哻anvas杞崲涓篵lob锛堝己鍒朵娇鐢≒NG鏍煎紡锛?
      const canvasBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(""));
          }
        }, "image/png"); // 寮哄埗浣跨敤PNG鏍煎紡
      });
      console.log(
        "",
        canvasBlob.size,
        "",
        canvasBlob.type
      );

      // 灏濊瘯浣跨敤鐜颁唬鍓创鏉緼PI
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          console.log("");
          await navigator.clipboard.write([
            new ClipboardItem({ [canvasBlob.type]: canvasBlob }),
          ]);

          success("");
          hideContextMenu();
          return;
        } catch (error) {
          console.warn("", error);
          // 缁х画灏濊瘯鍏朵粬鏂规硶
        }
      }

      // 鏂规硶3锛氫娇鐢╡xecCommand锛堝吋瀹规€ф柟娉曪級
      try {
        console.log("");

        // 鍒涘缓涓€涓彲閫夋嫨鐨勫厓绱?
        const selectableDiv = document.createElement("div");
        selectableDiv.style.position = "absolute";
        selectableDiv.style.left = "-9999px";
        selectableDiv.style.top = "-9999px";
        selectableDiv.style.width = "1px";
        selectableDiv.style.height = "1px";
        selectableDiv.style.overflow = "hidden";

        // 灏哻anvas娣诲姞鍒板彲閫夋嫨鐨刣iv涓?
        selectableDiv.appendChild(canvas);
        document.body.appendChild(selectableDiv);

        // 閫夋嫨canvas骞跺鍒?
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(canvas);
        selection.removeAllRanges();
        selection.addRange(range);

        const execSuccess = document.execCommand("copy");
        console.log("", execSuccess);

        // 娓呯悊
        document.body.removeChild(selectableDiv);
        selection.removeAllRanges();

        if (execSuccess) {
          success("");
          hideContextMenu();
          return;
        }
      } catch (execError) {
        console.warn("", execError);
      }

      // 鏂规硶4锛氭渶鍚庣殑澶囬€夋柟妗?- 鎻愮ず鐢ㄦ埛涓嬭浇
      warning("");
      hideContextMenu();
    } catch (canvasError) {
      console.warn("", canvasError);
      info("");
      hideContextMenu();
    } finally {
      // 娓呯悊涓存椂鍏冪礌
      document.body.removeChild(tempImg);
      URL.revokeObjectURL(tempImg.src);
    }
  } catch (error) {
    console.error("", error);
    info("");
    hideContextMenu();
  }
}

async function downloadImage(img) {
  if (!img) return;

  try {
    // 鑾峰彇鍥剧墖鐨刡lob鏁版嵁
    let imageBlob;
    if (img.blob) {
      imageBlob = img.blob;
    } else if (img.objectUrl) {
      // 濡傛灉鍙湁objectUrl锛岄渶瑕佸厛鑾峰彇blob
      const response = await fetch(img.objectUrl);
      imageBlob = await response.blob();
    } else {
      error("");
      return;
    }

    // 鍒涘缓涓嬭浇閾炬帴
    const url =
      imageBlob instanceof Blob ? URL.createObjectURL(imageBlob) : imageBlob;
    const link = document.createElement("a");
    link.href = url;
    link.download = img.name || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success("");
    hideContextMenu();
  } catch (error) {
    console.error("", error);
    error("");
    hideContextMenu();
  }
}

async function deleteImageFromContext(img) {
  if (!img) return;

  try {
    if (isDeleting(img.id)) return;
    // 鍏抽棴鑿滃崟鍚庡睍绀哄垹闄や腑鐨勯伄缃?
    hideContextMenu();
    startDeleting(img.id);
    console.time(`delete-image-${img.id}`);
    await withMinDuration(deleteImageToTrash(img.id), MIN_DELETE_MS);
    console.timeEnd(`delete-image-${img.id}`);
    success("");
    await load();

    // 瑙﹀彂鍒嗙粍鏁伴噺鏇存柊浜嬩欢
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (error) {
    error("");
  } finally {
    stopDeleting(img.id);
  }
}

function showGroupMenu(img) {
  // 瑙﹀彂鍏ㄥ眬浜嬩欢锛屾樉绀哄垎缁勯€夋嫨瀵硅瘽妗?
  window.dispatchEvent(
    new CustomEvent("showImageGroupDialog", {
      detail: { image: img },
    })
  );
  hideContextMenu();
}

// 浠庡彸閿彍鍗曟柊澧炵粍鍥?
function addToAlbumFromContext(img) {
  if (!img) return;

  // 瑙﹀彂缁勫浘妯″紡骞堕€変腑璇ュ浘鐗?
  emit("startAlbumMode");
  emit("toggleImageSelection", img.id);

  hideContextMenu();
}

// 澶勭悊纭鍒犻櫎瀵硅瘽妗?
function handleConfirm() {
  if (dialogConfig.value._onConfirm) {
    dialogConfig.value._onConfirm();
  }
}

function handleCancel() {
  if (dialogConfig.value._onCancel) {
    dialogConfig.value._onCancel();
  }
}

// 浠庡彸閿彍鍗曡繕鍘熺粍鍥?
async function restoreGroupFromContext(img) {
  if (!img) return;

  try {
    // 鑾峰彇闄勫浘鏁伴噺
    const children = await getChildrenImages(img.id);
    const childrenCount = children.length;

    if (childrenCount === 0) {
      error("");
      return;
    }

    // 鏄剧ず纭瀵硅瘽妗?
    await deleteConfirm(
      `纭畾瑕佸皢缁勫浘 "${img.name}" 杩樺師涓?${
        childrenCount + 1
      } 寮犵嫭绔嬪浘鐗囧悧锛焅n杩樺師鍚庯紝鎵€鏈夊浘鐗囧皢鍙樹负鐙珛鍥剧墖锛岀粍鍥惧叧绯诲皢琚В闄ゃ€俙,
      "",
      {
        confirmButtonText: "",
        cancelButtonText: "",
      }
    );

    // 鎵ц杩樺師鎿嶄綔
    const restoredCount = await restoreGroupToIndividualImages(img.id);

    success(`缁勫浘宸茶繕鍘燂紝${restoredCount + 1} 寮犲浘鐗囧凡鍙樹负鐙珛鍥剧墖`);

    // 閲嶆柊鍔犺浇鍥剧墖鍒楄〃
    await load();

    // 瑙﹀彂鍒嗙粍鏁伴噺鏇存柊浜嬩欢
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (err) {
    if (err.message === "") {
      // 鐢ㄦ埛鍙栨秷杩樺師锛屼笉鏄剧ず閿欒淇℃伅
      return;
    }
    console.error("", err);
    error("");
  } finally {
    hideContextMenu();
  }
}

// 鎵归噺鍒犻櫎鐩稿叧鍑芥暟
function selectAll() {
  images.value.forEach((img) => {
    if (!props.selectedImages.has(img.id)) {
      emit("toggleImageSelection", img.id);
    }
  });
}

function clearAll() {
  emit("clearSelection");
}

function exitBatchMode() {
  emit("clearSelection");
}

function confirmBatchDelete() {
  if (props.selectedImages.size === 0) {
    warning("");
    return;
  }

  // 鐩存帴瑙﹀彂鎵归噺鍒犻櫎浜嬩欢锛岃鐖剁粍浠跺鐞嗙‘璁ら€昏緫
  emit("batchDelete");
}

// 鑿滃崟鏍忕浉鍏冲嚱鏁?
function toggleMenu() {
  isMenuCollapsed.value = !isMenuCollapsed.value;
}

// 椤堕儴鍒锋柊鎸夐挳宸茬Щ闄?

function toggleUploadMode() {
  emit("toggleUploadMode");
}

function onFileChange(file) {
  console.log("[drag:1] ImageGallery onFileChange called", file?.name, file?.raw?.name);
  emit("fileChange", file);
}

function startBatchDelete() {
  emit("startBatchDelete");
}

function onToggleGroupSelector() {
  emit("showGroupSelector");
}

function selectGroup(groupId) {
  emit("selectGroup", groupId);
}

function showCreateGroup() {
  emit("showCreateGroup");
}

function showGroupManage() {
  emit("showGroupManage");
}

function onStartAlbumMode() {
  emit("startAlbumMode");
}

// 鎼滅储鐩稿叧鍑芥暟
function onToggleSearchArea() {
  showSearchArea.value = !showSearchArea.value;
  if (!showSearchArea.value) {
    // 鍏抽棴鎼滅储鍖哄煙鏃讹紝娓呴櫎鎼滅储鐘舵€?
    clearSearch();
  }
}

function onSearchChange() {
  // 瀹炴椂鎼滅储
  performRealtimeSearch();
}

function addTagFromInput() {
  // 澶勭悊鏍囩杈撳叆锛屾坊鍔犲綋鍓嶈緭鍏ユ鐨勫唴瀹逛綔涓烘爣绛?
  if (searchTagsInput.value) {
    const tag = searchTagsInput.value.trim();
    if (tag && !searchTags.value.includes(tag)) {
      searchTags.value.push(tag);
      searchTagsInput.value = "";
      // 娣诲姞鏍囩鍚庤Е鍙戞悳绱?
      performRealtimeSearch();
    }
  }
}

// 鎼滅储鏍囩绠＄悊鍑芥暟
function startAddingSearchTag() {
  isAddingSearchTag.value = true;
  newSearchTagInput.value = "";
  searchTagInputWidth.value = 80; // 閲嶇疆涓洪粯璁ゅ搴?

  // 绛夊緟DOM鏇存柊鍚庤仛鐒﹁緭鍏ユ
  setTimeout(() => {
    if (searchTagInput.value) {
      searchTagInput.value.focus();
    }
  }, 100);
}

function cancelAddSearchTag() {
  isAddingSearchTag.value = false;
  newSearchTagInput.value = "";
}

function confirmAddSearchTag() {
  if (!newSearchTagInput.value.trim()) {
    cancelAddSearchTag();
    return;
  }

  const tag = newSearchTagInput.value.trim();

  // 妫€鏌ユ爣绛炬槸鍚﹀凡瀛樺湪
  if (searchTags.value.includes(tag)) {
    error("");
    cancelAddSearchTag();
    return;
  }

  // 娣诲姞鏍囩鍒版悳绱㈠垪琛?
  searchTags.value.push(tag);

  // 娓呯┖杈撳叆妗嗗苟閫€鍑烘坊鍔犳ā寮?
  newSearchTagInput.value = "";
  isAddingSearchTag.value = false;

  // 瑙﹀彂鎼滅储
  performRealtimeSearch();
}

// 鍔ㄦ€佽皟鏁存悳绱㈡爣绛捐緭鍏ユ瀹藉害
function adjustSearchTagInputWidth() {
  if (!searchTagInput.value) return;

  // 浣跨敤Canvas API鏉ョ簿纭祴閲忔枃鏈搴?
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // 璁剧疆瀛椾綋鏍峰紡锛屼笌CSS涓殑鏍峰紡淇濇寔涓€鑷?
  context.font =
    '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const text = newSearchTagInput.value || "";
  const textWidth = context.measureText(text).width;

  // 璁剧疆鏈€灏忓搴?0px锛屾渶澶у搴?00px锛屽苟鍔犱笂涓€浜沺adding
  searchTagInputWidth.value = Math.min(Math.max(textWidth + 24, 80), 200);
}

function removeTag(tag) {
  const index = searchTags.value.indexOf(tag);
  if (index > -1) {
    searchTags.value.splice(index, 1);
    // 鍒犻櫎鏍囩鍚庤Е鍙戝疄鏃舵悳绱?
    performRealtimeSearch();
  }
}

function performRealtimeSearch() {
  // 濡傛灉娌℃湁鎼滅储鏉′欢锛屾仮澶嶅師濮嬬姸鎬?
  if (!searchName.value && searchTags.value.length === 0) {
    if (isSearchActive.value) {
      clearSearch();
    }
    return;
  }

  // 淇濆瓨鍘熷鍥剧墖鍒楄〃锛堝鏋滆繕娌℃湁淇濆瓨锛?
  if (!isSearchActive.value) {
    originalImages.value = [...images.value];
  }

  // 鎵ц鎼滅储
  let filteredImages = [...originalImages.value];

  // 鎸夊悕绉版悳绱紙鍓嶇紑鍖归厤锛?
  if (searchName.value) {
    const nameKeyword = searchName.value.toLowerCase();
    filteredImages = filteredImages.filter(
      (img) => img.name && img.name.toLowerCase().startsWith(nameKeyword)
    );
  }

  // 鎸夋爣绛炬悳绱紙鍓嶇紑鍖归厤锛?
  if (searchTags.value.length > 0) {
    filteredImages = filteredImages.filter((img) => {
      return searchTags.value.some((searchTag) => {
        const searchTagLower = searchTag.toLowerCase();
        // 妫€鏌ュ浘鐗囨槸鍚︽湁鏍囩锛屽苟涓旀爣绛句腑鍖呭惈鎼滅储鍏抽敭璇?
        if (img.tags && Array.isArray(img.tags)) {
          return img.tags.some((imgTag) =>
            imgTag.toLowerCase().includes(searchTagLower)
          );
        }
        return false;
      });
    });
  }

  images.value = filteredImages;
  isSearchActive.value = true;
}

function clearSearch() {
  searchName.value = "";
  searchTagsInput.value = "";
  searchTags.value = [];
  isSearchActive.value = false;

  // 娓呯悊鎼滅储鏍囩娣诲姞鐘舵€?
  isAddingSearchTag.value = false;
  newSearchTagInput.value = "";

  // 鎭㈠鍘熷鍥剧墖鍒楄〃
  if (originalImages.value.length > 0) {
    images.value = [...originalImages.value];
    originalImages.value = [];
  }
}

// 鍒濆鍖栧垪鏁拌缃?
function initializeColumnCount() {
  const savedColumnCount = localStorage.getItem("imageGalleryColumnCount");
  if (savedColumnCount) {
    try {
      const parsed = JSON.parse(savedColumnCount);
      columnCount.value = parsed;
    } catch (e) {
      console.warn("Failed to parse saved column count:", e);
    }
  }
}

// 澶勭悊鍒楁暟鍙樺寲
function handleColumnCountChanged(event) {
  columnCount.value = event.detail.columnCount;
}

// 璁＄畻缃戞牸鏍峰紡
const gridStyle = computed(() => {
  if (columnCount.value === "auto") {
    return {
      columnCount: "auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "12px",
    };
  } else {
    return {
      columnCount: columnCount.value.toString(),
      display: "block",
    };
  }
});
</script>

<style scoped>
.gallery-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.grid {
  column-count: 3;
  column-gap: 12px;
  padding: 16px;
}

/* 浠呭浘鐗囧尯鍩熸粴鍔?*/
.gallery-scroll {
  flex: 1;
  min-height: 0;
  /* 浼樺厛浣跨敤 overlay锛屽鏋滀笉鏀寔鍒欏洖閫€鍒?auto */
  overflow-y: overlay;
  /* 濮嬬粓涓烘粴鍔ㄦ潯棰勭暀绌洪棿锛岄伩鍏嶅搴︽尝鍔?*/
  scrollbar-gutter: stable;
  /* 骞虫粦婊氬姩 */
  scroll-behavior: smooth;
}

/* 鍥為€€鏂规锛氬浜庝笉鏀寔 overlay 鐨勬祻瑙堝櫒 */
@supports not (overflow-y: overlay) {
  .gallery-scroll {
    overflow-y: auto;
  }
}

/* 鑷畾涔夋粴鍔ㄦ潯鏍峰紡 - 閫忔槑鑳屾櫙锛屾偓鍋滄樉绀?*/
.gallery-scroll::-webkit-scrollbar {
  width: 8px;
  background: transparent;
  /* 纭繚婊氬姩鏉″缁堝崰鐢ㄧ┖闂?*/
  scrollbar-gutter: stable;
}

.gallery-scroll::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.gallery-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  transition: background-color 0.2s ease;
  /* 鏈€灏忛珮搴︼紝纭繚婊氬姩鏉″彲瑙佹€?*/
  min-height: 20px;
}

/* 婊氬姩鏉℃偓鍋滄椂鏇存槑鏄?*/
.gallery-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Firefox 婊氬姩鏉℃牱寮?*/
.gallery-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

/* 閽堝 Edge 娴忚鍣ㄧ殑婊氬姩鏉℃牱寮?*/
.gallery-scroll {
  -ms-overflow-style: -ms-autohiding-scrollbar;
}

/* 纭繚婊氬姩鏉″湪瑙︽懜璁惧涓婄殑琛ㄧ幇 */
@media (hover: none) {
  .gallery-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
  }

  .gallery-scroll {
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }
}

/* 楂樺姣斿害妯″紡鏀寔 */
@media (prefers-contrast: high) {
  .gallery-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.5);
  }

  .gallery-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .gallery-scroll {
    scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
  }
}
.card {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  width: 100%;
  break-inside: avoid;
  margin-bottom: 12px;
  position: relative;
}

/* 涓诲浘鐗规畩鏍峰紡 */
.card.is-main-image {
  /* 涓诲浘鏍峰紡鍙互鍦ㄨ繖閲屾坊鍔?*/
  position: relative;
}

.card.is-main-image::before {
  content: "";
  position: absolute;
  top: 8px;
  left: 8px;
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}
.card img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.card.is-deleting img {
  filter: blur(4px);
  pointer-events: none;
}
.deleting-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(0, 0, 0, 0.15);
  border-top-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #888;
}

.empty-content {
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
  color: #666;
}

.empty-tip {
  font-size: 12px;
  color: #999;
}
.viewer {
  width: 100%;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.viewer img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

/* 鍙抽敭鑿滃崟鏍峰紡 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 100px;
  padding: 2px 0;
  transition: left 0.15s ease-out, top 0.15s ease-out;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #333;
  font-size: 12px;
  line-height: 1.2;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.context-menu-item .el-icon {
  font-size: 12px;
  color: #666;
}

.context-menu-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 2px 0;
}

/* 鎵归噺鍒犻櫎鐘舵€佹潯鏍峰紡 */
.batch-delete-bar {
  position: sticky;
  top: 0;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 鎶樺彔鍖哄煙鍐呯殑鎵归噺鎿嶄綔鏉″鐢ㄦ牱寮?*/
.menu-batch-bar {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(245, 245, 245, 0.9);
  padding-left: 24px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 12px;
  color: #999;
  font-style: italic;
  font-weight: 400;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-actions .el-button {
  font-size: 12px;
  padding: 6px 12px;
}

/* 鐏拌壊涓婚鎸夐挳鏍峰紡 */
.gray-button {
  background: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  color: #666 !important;
}

.gray-button:hover {
  background: #e6e6e6 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

.gray-button:focus {
  background: #e6e6e6 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

.gray-button:active {
  background: #d9d9d9 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

.gray-button.is-disabled,
.gray-button.is-disabled:hover,
.gray-button.is-disabled:focus,
.gray-button.is-disabled:active {
  background: #f5f5f5 !important;
  border-color: #e4e7ed !important;
  color: #c0c4cc !important;
}

.batch-delete-icon-button {
  background: transparent !important;
  border: none !important;
  color: #ff6b6b !important;
  transition: all 0.3s ease !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.batch-delete-icon-button:hover {
  color: #ff5252 !important;
}

.batch-delete-icon-button:disabled {
  background: transparent !important;
  color: #c0c4cc !important;
  transform: none !important;
}

.batch-delete-icon-button .el-icon {
  font-size: 18px !important;
}

/* 閫変腑鐘舵€佹牱寮?*/
.card.is-selected {
  border-color: #409eff;
  /* box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); */
}

.selection-overlay {
  position: absolute;
  inset: 0;
  background: rgba(64, 158, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

/* 缁勫浘鏁伴噺寰芥爣 */
.album-count-badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  line-height: 1;
}

.check-icon {
  width: 32px;
  height: 32px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 鍙姌鍙犺彍鍗曟爮鏍峰紡 */
.collapsible-menu-bar {
  border-bottom: 1px solid #e0e0e0;

  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: rgba(245, 245, 245, 0.9);
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
}

.menu-header:hover {
  background: #e0e0e0;
}

.menu-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  height: 30px;
  width: 30px;
}

.menu-title .el-icon {
  font-size: 16px;
  color: #666;
}

.menu-toggle {
  transition: transform 0.3s ease;
  color: #666;
}

.menu-toggle.is-collapsed {
  transform: rotate(-90deg);
}

.menu-content {
  max-height: none; /* 绉婚櫎楂樺害闄愬埗锛岃鍐呭鑷劧灞曞紑 */
  overflow: visible; /* 绉婚櫎婊氬姩锛岃鍐呭瀹屽叏鍙 */
  transition: padding 0.3s ease;
  background: rgba(245, 245, 245, 0.9);
}

.menu-content.is-collapsed {
  max-height: 0;
  overflow: hidden;
}

.menu-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px;
}

.menu-action-item {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.menu-action-item:hover {
  background: #e0e0e0;
  color: #333;
}

/* 鍖哄垎涓婁紶鎸夐挳鐨勬牱寮忥紙濮嬬粓绐佸嚭锛?*/
.menu-action-item.upload {
  background: #f0f0f0;
  color: #666;
}
.menu-action-item.upload:hover {
  background: #e0e0e0;
  color: #333;
}

/* 鍏朵粬鎸夐挳鐨勯€変腑鎬佹牱寮?*/
.menu-action-item.active {
  background: #e0e0e0;
  color: #333;
}

/* 缁勫浘鍥炬爣鏍峰紡 */
.menu-action-item .album-icon {
  width: 22px;
  height: auto;
  object-fit: contain;
}

/* 涓婁紶鍖哄煙鏍峰紡 */
.upload-area {
  border-top: 1px solid #e0e0e0;
  background-color: rgba(245, 245, 245, 0.9);
  padding: 16px;
  height: 120px; /* 鍥哄畾楂樺害 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area .uploader {
  border: 2px dashed #d9d9d9;
}

.upload-area .uploader:hover {
  border-color: rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.05);
}

.uploader {
  border: none; /* 绉婚櫎榛樿杈规锛岄伩鍏嶅弻灞傝櫄绾?*/
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.uploader:hover {
  background: #f0f9ff;
}

/* 瑕嗙洊 el-upload 鐨勯粯璁ゆ牱寮?*/
.uploader :deep(.el-upload-dragger) {
  border: none;
  background: transparent;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.uploader :deep(.el-upload-dragger:hover) {
  border: none;
  background: transparent;
}

/* 璋冩暣涓婁紶鍥炬爣澶у皬 */
.uploader :deep(.el-icon--upload) {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}

.uploader :deep(.el-upload__text) {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}

.el-upload__tip {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

/* 鍒嗙粍閫夋嫨鍣ㄦ牱寮?*/
.group-selector {
  border-top: 1px solid #e0e0e0;
  padding: 8px 16px; /* 缂╁皬涓婁笅鍐呰竟璺濓紝閬垮厤椤舵爮琚尋鍘?*/
  background-color: rgba(245, 245, 245, 0.9);
}

.group-selector-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.group-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap; /* 鍏佽鎹㈣锛屽畬鏁村睍绀?*/
}

.group-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease;
  vertical-align: top;
}

.group-tab.more-group-tab {
  background: #f0f0f0;
}

.group-tab:hover {
  background: #e0e0e0;
  border-color: #e0e0e0;
}

.group-tab.active {
  background: #e0e0e0;
  border-color: #e0e0e0;
  color: #333;
}

.group-tab.create-group-tab {
  background: #909399;
  border-color: #909399;
  color: white;
  min-width: 32px;
  justify-content: center;
  padding: 6px;
}

.group-tab.create-group-tab:hover {
  background: #a6a9ad;
  border-color: #a6a9ad;
}

.group-tab .group-name {
  font-weight: 500;
  color: #333;
}

.group-tab .group-count {
  font-size: 11px;
  opacity: 0.8;
}

/* 鎼滅储鍖哄煙鏍峰紡 */
.search-area {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
  background-color: rgba(245, 245, 245, 0.9);
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.search-field .el-input {
  width: 100%;
}

.search-field .el-input :deep(.el-input__wrapper) {
  background-color: rgba(250, 250, 250, 0.9);
  border-radius: 100px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: none;
  font-size: 13px;
}

.search-field .el-input :deep(.el-input__inner) {
  font-size: 13px;
  color: #333;
}

.search-field .el-input :deep(.el-input__inner::placeholder) {
  font-size: 12px;
  color: #999;
  font-style: italic;
  font-weight: 400;
}

/* 鎼滅储鏍囩瀹瑰櫒鏍峰紡 */
.tags-container {
  position: relative;
}

.tags-display {
  min-height: 40px;

  background: rgba(245, 245, 245, 0.8);
  border-radius: 100px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* .tags-display:hover {
  background: rgba(255, 255, 255, 0.8);
} */

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.tag-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.tag-remove {
  font-size: 12px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.tag-item:hover .tag-remove {
  opacity: 1;
}

/* 娣诲姞鏍囩鎸夐挳鏍峰紡 */
.add-tag-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(102, 126, 234, 0.1);
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #667eea;
}

.add-tag-button:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.5);
  transform: scale(1.05);
}

.add-tag-button .el-icon {
  font-size: 16px;
}

/* 鎻愮ず鏂囧瓧鏍峰紡 */
.tag-hint-text {
  color: #8a9ba8;
  font-size: 13px;
  font-style: italic;
  margin-left: 8px;
  user-select: none;
}

/* 姝ｅ湪娣诲姞鐨勬爣绛炬牱寮?*/
.adding-tag {
  background: rgba(102, 126, 234, 0.1) !important;
  border: 2px solid #667eea !important;
  min-width: 80px;
  transition: width 0.2s ease;
}

.tag-input-field {
  background: transparent;
  border: none;
  outline: none;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  padding: 0;
  margin: 0;
}

.tag-input-field::placeholder {
  color: #8a9ba8;
}

.search-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.search-actions .el-button {
  font-size: 12px;
  padding: 6px 12px;
}

/* 婊戝姩闈㈡澘鍔ㄧ敾鏁堟灉 */
.slide-down-panel {
  overflow: hidden;
}

/* 涓轰笉鍚岀被鍨嬬殑闈㈡澘璁剧疆鍚堥€傜殑鏈€澶ч珮搴?*/
.group-selector.slide-down-panel {
  animation: slideDownGroup 0.3s ease-out;
}

@keyframes slideDownGroup {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 100px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
}

.upload-area.slide-down-panel {
  animation: slideDownUpload 0.3s ease-out;
}

@keyframes slideDownUpload {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 140px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
}

.menu-batch-bar.slide-down-panel {
  animation: slideDownBatch 0.3s ease-out;
}

@keyframes slideDownBatch {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 80px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
}

.search-area.slide-down-panel {
  animation: slideDownSearch 0.3s ease-out;
}

@keyframes slideDownSearch {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 300px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
}
</style>
