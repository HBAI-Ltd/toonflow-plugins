<template>
  <div class="image" ref="triggerRef" @click="togglePopup">
    <Handle :id="inputHandelId" type="target" :position="Position.Left" :is-valid-connection="isValidConnection" />
    <img v-if="data?.src" :src="data.src" class="mainImg" alt="" />
    <div v-else class="imgPlaceholder">
      <t-empty type="maintenance" title="没有图片" />
    </div>
    <Handle :id="outputHandelId" type="source" :position="Position.Right" :is-valid-connection="isValidConnection" />
    <div v-show="popupOpen" class="imageNodeFloat" @click.stop @mousedown.stop>
      <div class="refList f">
        <div class="item" v-for="(entry, i) in mediaInputs" :key="i">
          <img v-if="(entry.type === 'IMAGE' || entry.type === 'VIDEO') && entry.value?.url" :src="entry.value.url" class="smallImage" alt="" />
          <t-icon v-else-if="entry.type === 'AUDIO'" name="sound" size="24px" />
        </div>
      </div>
      <div class="input">
        <mentionInput :list="fileList" v-model="prompt" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow, type ValidConnectionFunc } from "@vue-flow/core";
import mentionInput from "@/components/mentionInput.vue";
import checkConnection from "#/core/checkConnection";
import { useInputHandleValue } from "#/core/useInputHandle";
import { v4 as uuid } from "uuid";

const { viewport } = useVueFlow("editFlow");

const data = defineModel<Data>("DATA");

const triggerRef = ref<HTMLElement | null>(null);
const popupOpen = ref(false);

const inputHandelId = uuid();
const outputHandelId = uuid();

// values/types 均为数组，支持 N 连 1
const mediaInputs = useInputHandleValue<ImageData | VideoData | AudioData>("editFlow", inputHandelId);

const fileList = computed(() => {
  const labelMap: Record<string, string> = { IMAGE: "图片", VIDEO: "视频", AUDIO: "音频" };
  return mediaInputs.value.flatMap(({ value: val, type: t }, i) => {
    if (!val?.url) return [];
    const typeStr = t ?? "IMAGE";
    return [
      {
        id: `${inputHandelId}_${i}`,
        label: val.url.split("/").pop() || labelMap[typeStr] || typeStr,
        type: typeStr,
        thumb: typeStr !== "AUDIO" ? val.url : "",
      },
    ];
  });
});

const prompt = computed({
  get: () => data.value?.prompt,
  set: (val) => {
    if (data.value) data.value.prompt = val ?? "";
  },
});

function togglePopup() {
  popupOpen.value = !popupOpen.value;
}

function onDocMousedown(e: MouseEvent) {
  if (!popupOpen.value) return;
  const inTribute = !!document.querySelector(".tribute-container")?.contains(e.target as Node);
  if (inTribute) return;
  if (!triggerRef.value?.contains(e.target as Node)) {
    popupOpen.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", onDocMousedown, true));
onUnmounted(() => document.removeEventListener("mousedown", onDocMousedown, true));

const isValidConnection: ValidConnectionFunc = (connection, elements) => checkConnection({ connection, elements, selfLoop: true }).canConnect;

const HANDLEDOPT = ref<HANDLEDOPT>({
  inputs: {
    [inputHandelId]: ["IMAGE"],
  },
  outputs: {
    [outputHandelId]: { type: ["IMAGE"] },
  },
});

// 同步 data.src 到 output value，使下游节点能通过 useInputHandleValue 读取
watch(
  () => data.value?.src,
  (src) => {
    HANDLEDOPT.value.outputs![outputHandelId].value = src ? { url: src } : null;
  },
  { immediate: true }
);

defineExpose({ HANDLEDOPT });
</script>

<script lang="ts">
import type { HANDLEDOPT, ImageData, VideoData, AudioData } from "#/core/nodeType";
import logo from "@/assets/logo.jpg";

export const icon = logo;

interface Data {
  src: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  size: string;
}

export const defaultData: Data = {
  src: "",
  prompt: "",
  model: "",
  aspectRatio: "",
  size: "",
};
</script>

<style lang="scss" scoped>
.image {
  position: relative;
  width: 250px;
  cursor: pointer;
  overflow: visible;

  .mainImg {
    width: 100%;
    height: auto;
    display: block;
  }

  .imgPlaceholder {
    width: 100%;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .imageNodeFloat {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform-origin: top center;
    transform: translateX(-50%) scale(v-bind("1 / viewport.zoom"));
    z-index: 999999;
    width: 50vw;
    min-height: 150px;
    padding: 12px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

    .refList {
      gap: 8px;

      .item {
        .smallImage {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
      }
    }

    .input {
      max-height: 300px;
      height: 100%;
      overflow: auto;
    }
  }
}
</style>
