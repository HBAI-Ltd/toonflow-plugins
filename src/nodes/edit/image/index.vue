<template>
  <div class="imageNode">
    <Handle :id="outputHandelId" type="source" :position="Position.Right" :is-valid-connection="isValidConnection" />

    <div class="uploadArea" @click="triggerUpload">
      <template v-if="data!.src">
        <img :src="data!.src" class="preview" alt="" />
        <div class="previewOverlay">
          <t-button size="small" variant="text" theme="default" @click.stop="triggerUpload">
            <template #icon><t-icon name="swap" /></template>
            更换
          </t-button>
          <t-button size="small" variant="text" theme="danger" @click.stop="clearFile">
            <template #icon><t-icon name="delete" /></template>
            清除
          </t-button>
        </div>
      </template>
      <div v-else class="placeholder">
        <t-icon name="image" size="40px" />
        <span class="placeholderTitle">点击选择图片</span>
        <span class="placeholderSub">支持 PNG、JPG、GIF 等格式</span>
      </div>
      <input ref="fileInputRef" type="file" accept="image/*" class="fileInput" @change="onFileChange" />
    </div>

    <div class="toolbar">
      <span v-if="data!.src" class="fileName">{{ data!.fileName }}</span>
      <span v-else class="toolbarHint">或选择其他来源</span>
      <t-dropdown :options="options" trigger="click" @click="clickHandler">
        <t-button size="small" variant="outline">
          <template #icon><t-icon name="add-circle" /></template>
          更多来源
        </t-button>
      </t-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessagePlugin } from "tdesign-vue-next";
import type { DropdownOption } from "tdesign-vue-next/es/dropdown";
import { Handle, Position, type ValidConnectionFunc } from "@vue-flow/core";
import { useToonflowUMD, type TargetHandleData } from "#/core";

interface Data {
  src: string;
  fileName: string;
}

const sdk = useToonflowUMD();
// TODO(sdk): ui.openAssetManager / ui.openStoryboardImageCheck 在新 SDK 中尚未暴露，临时通过 any 透传
const fn = sdk.fn as any;

const data = sdk.getData<Data>();

const fileInputRef = ref<HTMLInputElement>();

const { id: outputHandelId, value: outputValue } = sdk.register.handles.target<TargetHandleData<"IMAGE">>("output", {
  type: "IMAGE",
  value: null,
});

watch(
  () => [data.value?.src, data.value?.fileName] as const,
  ([src, fileName]) => {
    outputValue.value = {
      type: "IMAGE",
      value: src ? { url: src, name: fileName || undefined } : null,
    };
  },
  { immediate: true },
);

const isValidConnection: ValidConnectionFunc = (connection, elements) => {
  const { canConnect, failReason } = sdk.checkConnection({ connection, elements });
  if (!canConnect) MessagePlugin.warning(`连接失败：${failReason}`);
  return canConnect;
};

const options: DropdownOption[] = [
  { content: "选择资产", value: 1 },
  { content: "选择分镜图片", value: 2 },
  { divider: true },
  { content: "读取剪切板", value: 3 },
];

async function clickHandler(opt: DropdownOption) {
  if (opt.value == 1) {
    const [asset] = await fn.ui.openAssetManager({
      multiple: false,
      types: ["role", "tool", "scene", "clip"],
      clipMediaTypes: ["image"],
    });
    if (!asset || !data.value) return;
    data.value.src = asset.src;
    data.value.fileName = asset.name;
  } else if (opt.value == 2) {
    const [item] = await fn.ui.openStoryboardImageCheck({ multiple: false });
    if (!item || !data.value) return;
    data.value.src = item.imageUrl;
    data.value.fileName = item.name;
  } else if (opt.value == 3) {
    await pasteFromClipboard();
  }
}

async function pasteFromClipboard() {
  let items: ClipboardItems;
  try {
    items = await navigator.clipboard.read();
  } catch {
    MessagePlugin.error("读取剪切板失败，请检查权限");
    return;
  }
  for (const item of items) {
    const imageType = item.types.find((t) => t.startsWith("image/"));
    if (!imageType) continue;
    const blob = await item.getType(imageType);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!data.value) return;
      data.value.src = ev.target?.result as string;
      data.value.fileName = "剪切板图片";
    };
    reader.readAsDataURL(blob);
    return;
  }
  MessagePlugin.warning("剪切板中没有图片");
}

function triggerUpload() {
  fileInputRef.value?.click();
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !data.value) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    data.value!.src = ev.target?.result as string;
    data.value!.fileName = file.name;
  };
  reader.readAsDataURL(file);
}

function clearFile() {
  if (!data.value) return;
  data.value.src = "";
  data.value.fileName = "";
  if (fileInputRef.value) fileInputRef.value.value = "";
}
</script>

<style lang="scss" scoped>
.imageNode {
  width: 300px;
  padding: 6px;

  .uploadArea {
    position: relative;
    width: 100%;
    height: 220px;
    border: 2px dashed var(--td-border-level-2-color, #dcdcdc);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    background: var(--td-bg-color-container, #fafafa);
    transition: border-color 0.2s, background 0.2s;

    &:hover {
      border-color: var(--td-brand-color, #0052d9);
      background: var(--td-brand-color-light, #f0f4ff);

      .previewOverlay {
        opacity: 1;
      }
    }

    .preview {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .previewOverlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: rgba(0, 0, 0, 0.45);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--td-text-color-placeholder, #bbb);
      pointer-events: none;

      .placeholderTitle {
        font-size: 14px;
        font-weight: 500;
        color: var(--td-text-color-secondary, #888);
      }

      .placeholderSub {
        font-size: 12px;
        color: var(--td-text-color-placeholder, #bbb);
      }
    }

    .fileInput {
      display: none;
    }
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 2px 0;

    .fileName {
      flex: 1;
      font-size: 12px;
      color: var(--td-text-color-secondary, #666);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .toolbarHint {
      flex: 1;
      font-size: 12px;
      color: var(--td-text-color-placeholder, #bbb);
    }
  }
}
</style>
