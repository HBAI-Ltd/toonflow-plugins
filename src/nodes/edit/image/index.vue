<template>
  <div class="upload">
    <Handle :id="outputHandelId" type="source" :position="Position.Right" :is-valid-connection="isValidConnection" />

    <div class="uploadArea" @click="triggerUpload">
      <img v-if="mediaType === 'IMAGE' && data!.src" :src="data!.src" class="preview" alt="" />
      <video v-else-if="mediaType === 'VIDEO' && data!.src" :src="data!.src" class="preview" controls @click.stop />
      <audio v-else-if="mediaType === 'AUDIO' && data!.src" :src="data!.src" class="audioPreview" controls @click.stop />
      <div v-else class="placeholder">
        <t-icon name="upload" size="32px" />
        <span>点击上传图片 / 视频 / 音频</span>
      </div>
      <input ref="fileInputRef" type="file" accept="image/*,video/*,audio/*" class="fileInput" @change="onFileChange" />
    </div>

    <div v-if="data!.src" class="info">
      <span class="fileName">{{ data!.fileName }}</span>
      <t-button size="small" variant="text" theme="danger" @click.stop="clearFile">清除</t-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, type ValidConnectionFunc } from "@vue-flow/core";
import checkConnection from "#/core/checkConnection";
import { v4 as uuid } from "uuid";

const data = defineModel<Data>("DATA");

const fileInputRef = ref<HTMLInputElement>();

const isValidConnection: ValidConnectionFunc = (connection, elements) =>
  checkConnection({ connection, elements }).canConnect;

const outputHandelId = uuid();

const mediaType = computed<"IMAGE" | "VIDEO" | "AUDIO">(() => {
  const src = data.value?.src ?? "";
  if (src.startsWith("data:video/")) return "VIDEO";
  if (src.startsWith("data:audio/")) return "AUDIO";
  return "IMAGE";
});

const HANDLEDOPT = ref<HANDLEDOPT>({
  outputs: {
    [outputHandelId]: { type: ["IMAGE"], value: null },
  },
});

watchEffect(() => {
  const output = HANDLEDOPT.value.outputs![outputHandelId];
  output.type = [mediaType.value];
  output.value = data.value?.src ? { url: data.value.src } : null;
});

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


defineExpose({ HANDLEDOPT });
</script>

<script lang="ts">
import type { HANDLEDOPT } from "#/core/nodeType";
import logo from "@/assets/logo.jpg";

export const icon = logo;

interface Data {
  src: string;
  fileName: string;
}

export const defaultData: Data = {
  src: "",
  fileName: "",
};
</script>

<style lang="scss" scoped>
.upload {
  position: relative;
  width: 300px;

  .uploadArea {
    width: 100%;
    height: 240px;
    border: 2px dashed var(--td-border-level-2-color, #dcdcdc);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--td-brand-color, #0052d9);
    }

    .preview {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .audioPreview {
      width: 90%;
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--td-text-color-placeholder, #aaa);
    }

    .fileInput {
      display: none;
    }
  }

  .info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 4px 0;

    .fileName {
      flex: 1;
      font-size: 12px;
      color: var(--td-text-color-secondary, #666);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
