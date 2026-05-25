<template>
  <div class="storyboard">
    <t-empty v-if="!data?.storyboard?.length" description="暂无分镜" />
    <template v-else>
      <div class="selBar">
        <t-checkbox :checked="allSelected" :indeterminate="someSelected" @change="toggleAll">全选</t-checkbox>
        <div class="selActions">
          <template v-if="selected.size > 0">
            <span class="selCount">已选 {{ selected.size }} / {{ data.storyboard.length }} 个</span>
            <t-button size="small" theme="primary" variant="outline" @click="generate">生成</t-button>
            <t-button size="small" theme="danger" variant="outline" @click="remove">删除</t-button>
            <t-button size="small" variant="text" @click="clearSelect">清空</t-button>
          </template>
        </div>
      </div>
      <div class="grid">
        <t-tooltip
          v-for="(item, index) in data.storyboard"
          :key="item.id ?? index"
          placement="bottom"
          :show-arrow="false"
          destroy-on-close
          overlay-class-name="storyboardTip">
          <template #content>
            <div class="tipContent">
              <div class="tipTitle">{{ item.videoDesc }}</div>
              <div class="tipPrompt">{{ item.prompt }}</div>
              <div v-if="item.duration" class="tipMeta">时长：{{ item.duration }}s</div>
              <div v-if="item.shouldGenerateImage" class="tipMeta">需生成配图</div>
              <div v-if="item.reason && item.state === '生成失败'" class="tipError">{{ item.reason }}</div>
            </div>
          </template>
          <div class="cellWrap">
            <div class="cell" :class="{ selected: selected.has(item.id ?? index) }" @click="toggleSelect(item.id ?? index)">
              <div class="imgArea" @click.stop="item.src && showPreview(item.src)">
                <t-image v-if="item.src" :src="item.src" fit="scale-down" class="cellImg">
                  <template #loading><t-loading size="small" /></template>
                </t-image>
                <div v-else class="cellEmpty">
                  <t-icon name="image-error" size="20px" />
                </div>
              </div>
              <div class="cellOverlay">
                <t-checkbox :checked="selected.has(item.id ?? index)" class="cellCheck" @click.stop @change="toggleSelect(item.id ?? index)" />
                <t-tag size="small" :theme="stateTheme[item.state]" class="stateTag">{{ item.state }}</t-tag>
              </div>
              <div class="caption">
                <span class="captionText">{{ item.videoDesc }}</span>
                <t-button size="small" variant="text" class="editBtn" @click.stop="openEdit(index)">
                  <template #icon><t-icon name="edit" size="11px" /></template>
                </t-button>
              </div>
            </div>
            <div class="insertBtn" @click.stop="insertAfter(index)">
              <t-icon name="add" size="10px" />
            </div>
          </div>
        </t-tooltip>
      </div>
    </template>

    <teleport to="body">
      <t-image-viewer v-model:visible="preview.visible" :images="preview.images" />
    </teleport>

    <t-dialog v-model:visible="edit.visible" header="编辑分镜" attach="body" width="480px" destroy-on-close @confirm="saveEdit">
      <t-form v-if="edit.form" :data="edit.form" label-align="right" label-width="80px" colon>
        <t-form-item label="视频描述" name="videoDesc">
          <t-input v-model="edit.form.videoDesc" placeholder="请输入视频描述" />
        </t-form-item>
        <t-form-item label="提示词" name="prompt">
          <t-textarea v-model="edit.form.prompt" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="请输入提示词" />
        </t-form-item>
        <t-form-item label="时长(s)" name="duration">
          <t-input-number v-model="edit.form.duration" :min="0" :step="1" theme="column" placeholder="请输入时长" style="width: 100%" />
        </t-form-item>
        <t-form-item label="需生成配图" name="shouldGenerateImage">
          <t-switch v-model="edit.form.shouldGenerateImage" :true-value="1" :false-value="0" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
const data = defineModel<Data>("DATA");
const storyboard = computed(() => data.value?.storyboard ?? []);

// --- 预览 ---
const preview = reactive({ visible: false, images: [] as string[] });
function showPreview(src: string) {
  preview.images = [src];
  preview.visible = true;
}

// --- 选择 ---
const selected = shallowRef(new Set<number | string>());
const allSelected = computed(() => storyboard.value.length > 0 && selected.value.size === storyboard.value.length);
const someSelected = computed(() => selected.value.size > 0 && !allSelected.value);

function toggleSelect(key: number | string) {
  selected.value.has(key) ? selected.value.delete(key) : selected.value.add(key);
  triggerRef(selected);
}
function toggleAll() {
  selected.value = allSelected.value ? new Set() : new Set(storyboard.value.map((item, i) => item.id ?? i));
}
function clearSelect() {
  selected.value = new Set();
}

// --- 编辑 ---
const edit = reactive({ visible: false, index: -1, form: null as (StoryboardItem & { src: string }) | null });

function openEdit(index: number) {
  const item = storyboard.value[index];
  edit.form = { ...item, src: item.src ?? "" };
  edit.index = index;
  edit.visible = true;
}
function saveEdit() {
  if (!edit.form || !data.value) return;
  data.value.storyboard[edit.index] = { ...edit.form, src: edit.form.src || null };
  edit.visible = false;
}

// --- 操作 ---
function generate() {
  console.log("%c generate storyboard", "background:#465975", [...selected.value]);
  window.$message?.info("生成功能待接入");
}
function remove() {
  console.log("%c remove storyboard", "background:#465975", [...selected.value]);
  window.$message?.info("删除功能待接入");
}
function insertAfter(index: number) {
  if (!data.value) return;
  data.value.storyboard.splice(index + 1, 0, { id: Date.now(), prompt: "", src: null, state: "未生成", videoDesc: "", shouldGenerateImage: 0 });
  nextTick(() => openEdit(index + 1));
}

const stateTheme: Record<StoryboardState, "default" | "primary" | "success" | "danger"> = {
  未生成: "default",
  生成中: "primary",
  已完成: "success",
  生成失败: "danger",
};
</script>

<script lang="ts">
import logo from "@/assets/logo.jpg";

type StoryboardState = "未生成" | "生成中" | "已完成" | "生成失败";

interface StoryboardItem {
  id?: number;
  duration?: number;
  prompt: string;
  trackId?: number;
  associateAssetsIds?: number[];
  src: string | null;
  state: StoryboardState;
  flowId?: number;
  reason?: string;
  videoDesc: string;
  shouldGenerateImage: number;
}

interface Data {
  storyboard: StoryboardItem[];
}

export const icon = logo;
export const defaultData: Data = { storyboard: [] };
</script>

<style lang="scss" scoped>
.storyboard {
  width: 550px;
  padding: 12px;
  box-sizing: border-box;

  .selBar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2px 8px;
    font-size: 12px;

    .selActions {
      display: flex;
      align-items: center;
      gap: 6px;

      .selCount {
        font-size: 12px;
        color: var(--td-text-color-secondary, #888);
      }
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    width: 100%;

    .cellWrap {
      position: relative;
      min-width: 0;

      &:hover .insertBtn {
        opacity: 1;
      }

      .insertBtn {
        position: absolute;
        right: -11px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--td-brand-color, #0052d9);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.15s;
        cursor: pointer;
      }

      .cell {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--td-component-border, #e7e7e7);
        background: var(--td-bg-color-secondarycontainer, #f3f3f3);
        cursor: pointer;
        transition: border-color 0.15s;
        height: 100%;

        &.selected {
          border-color: var(--td-brand-color, #0052d9);
          box-shadow: 0 0 0 1px var(--td-brand-color, #0052d9);
        }

        &:hover .editBtn {
          opacity: 1 !important;
        }

        .imgArea {
          flex: 1;
          cursor: zoom-in;

          .cellImg {
            width: 100%;
            height: auto;
            display: block;
          }
        }

        .cellEmpty {
          width: 100%;
          height: 100%;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--td-text-color-placeholder, #c0c4cc);
        }

        .cellOverlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 3px;

          .cellCheck {
            :deep(.t-checkbox__label) {
              display: none;
            }
            :deep(.t-checkbox__input) {
              border-color: rgba(255, 255, 255, 0.85);
              background: rgba(0, 0, 0, 0.25);
            }
          }

          .stateTag {
            font-size: 10px !important;
            height: 16px !important;
            line-height: 16px !important;
            padding: 0 3px !important;
          }
        }

        .caption {
          display: flex;
          align-items: center;
          padding: 2px 2px 2px 4px;
          font-size: 10px;
          color: var(--td-text-color-primary, #262626);
          background: var(--td-bg-color-container, #fff);

          .captionText {
            flex: 1;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .editBtn {
            flex-shrink: 0;
            opacity: 0;
            transition: opacity 0.15s;
            color: var(--td-text-color-secondary, #888) !important;
            height: 16px !important;
            padding: 0 2px !important;
            min-width: unset !important;
          }
        }
      }
    }
  }
}
</style>

<style>
.storyboardTip {
  max-width: 220px;

  .tipContent {
    .tipTitle {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .tipPrompt {
      font-size: 12px;
      color: #aaa;
      word-break: break-all;
      margin-bottom: 4px;
    }
    .tipMeta {
      font-size: 11px;
      color: #bbb;
    }
    .tipError {
      font-size: 12px;
      color: #e34d59;
      word-break: break-all;
      margin-top: 4px;
    }
  }
}
</style>
