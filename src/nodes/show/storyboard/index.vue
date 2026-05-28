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
        <div v-for="(item, index) in data.storyboard" :key="item.id ?? index" class="cellWrap">
          <div class="hoverTip">
            <div class="tipTitle">{{ item.videoDesc }}</div>
            <div v-if="item.prompt" class="tipPrompt">{{ item.prompt }}</div>
            <div v-if="item.duration" class="tipMeta">时长：{{ item.duration }}s</div>
            <div v-if="item.shouldGenerateImage" class="tipMeta">需生成配图</div>
            <div v-if="item.reason && item.state === '生成失败'" class="tipError">{{ item.reason }}</div>
          </div>
          <div class="cell" :class="{ selected: selected.has(item.id ?? index) }" @click="toggleSelect(item.id ?? index)">
            <div class="imgArea" @click.stop="item.src && showPreview(item.src)">
              <t-image v-if="item.src" :src="item.src" fit="scale-down" class="cellImg">
                <template #loading><t-loading size="small" /></template>
              </t-image>
              <div v-else class="cellEmpty">
                <t-icon name="image-error" size="20px" />
              </div>
              <div class="imgEditBtn" @click.stop="editImage(index)">
                <t-icon name="edit" size="11px" />
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
      </div>
    </template>

    <teleport to="body">
      <t-image-viewer v-if="preview.visible" v-model:visible="preview.visible" :images="preview.images" />
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
import { useToonflowUMD } from "#/core";

const { fn } = useToonflowUMD();

const data = defineModel<Data>("DATA");
const storyboard = computed(() => data.value?.storyboard ?? []);

const preview = reactive({ visible: false, images: [] as string[] });
function showPreview(src: string) {
  preview.images = [src];
  preview.visible = true;
}

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

async function editImage(index: number) {
  const item = storyboard.value[index];
  if (!item || !data.value) return;

  let needBuild = !item.flowId;
  if (item.flowId) {
    const res = await fn.flow.list({ id: item.flowId });
    if (!res.data?.data?.length) needBuild = true;
  }

  if (needBuild) {
    item.flowId = Date.now();

    const assocIds = item.associateAssetsIds ?? [];
    const assocAssets: Array<{ src: string; name: string }> = [];
    if (assocIds.length > 0) {
      const results = await Promise.all(assocIds.map((id) => fn.assets.item(id)));
      for (const res of results) {
        if (res.code === 200 && res.data) {
          const d = res.data as any;
          assocAssets.push({ src: d.src ?? "", name: d.name ?? "" });
        }
      }
    }

    const imageNodeDefs = assocAssets.map((asset, i) => ({
      nodeId: `img_${i + 1}`,
      src: asset.src,
      name: asset.name,
    }));

    const imageNodes = imageNodeDefs.map((def, i) => ({
      id: def.nodeId,
      type: "pluginNode",
      position: { x: 200, y: 100 + i * 400 },
      data: {
        pluginId: "toonflowPlugin:image",
        data: { src: def.src, fileName: def.name },
      },
    }));

    const imageEdges = imageNodeDefs.map((def, i) => ({
      id: `e_img${i + 1}_generate`,
      type: "edge",
      source: def.nodeId,
      sourceHandle: `${def.nodeId}__output`,
      target: "generate",
      targetHandle: `generate__input`,
    }));

    await fn.flow.insert({
      id: item.flowId,
      flowData: JSON.stringify({
        nodes: [
          ...imageNodes,
          {
            id: "generate",
            type: "pluginNode",
            position: { x: 600, y: 100 },
            data: {
              pluginId: "toonflowPlugin:imageGenerate",
              data: {
                prompt: item.prompt || "",
                generatedImage: item.src || "",
                references: [],
                model: "",
                ratio: "16:9",
                quality: "1k",
                steps: 1,
              },
            },
          },
        ],
        edges: imageEdges,
      }),
    });
    data.value.storyboard[index].flowId = item.flowId;
    data.value = { ...data.value };
  }

  const res = await fn.ui.openEditor({
    flowId: item.flowId!,
    selectorMode: ["IMAGE"],
  });
  if (!res || res.type !== "IMAGE") return;

  data.value.storyboard[index].src = res.value.url;
  data.value = { ...data.value };
}

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
</script>

<style lang="scss" scoped>
.storyboard {
  width: 550px;
  padding: 12px;

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

      &:hover .hoverTip {
        opacity: 1;
        visibility: visible;
      }

      .hoverTip {
        position: absolute;
        top: calc(100% + 5px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 30, 30, 0.88);
        color: #fff;
        border-radius: 5px;
        padding: 7px 9px;
        z-index: 20;
        min-width: 140px;
        max-width: 50vw;
        width: 50vw;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.15s;
        white-space: normal;
        word-break: break-all;

        .tipTitle {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .tipPrompt {
          font-size: 12px;
          color: #bbb;
          margin-bottom: 4px;
        }

        .tipMeta {
          font-size: 11px;
          color: #999;
        }

        .tipError {
          font-size: 12px;
          color: #e34d59;
          margin-top: 4px;
        }
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
          position: relative;

          &:hover .imgEditBtn {
            opacity: 1;
          }

          .imgEditBtn {
            position: absolute;
            bottom: 3px;
            right: 3px;
            width: 18px;
            height: 18px;
            border-radius: 3px;
            background: rgba(0, 0, 0, 0.45);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s;
            z-index: 2;
          }

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
