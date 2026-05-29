<template>
  <div class="image" ref="triggerRef" @click="popupOpen = !popupOpen">
    <Handle :id="inputHandelId" type="target" :position="Position.Left" :is-valid-connection="isValidConnection" />
    <img v-if="data?.generatedImage" :src="data.generatedImage" class="mainImg" alt="" />
    <div v-else class="imgPlaceholder">
      <t-empty type="maintenance" title="没有图片" />
    </div>
    <Handle :id="outputHandelId" type="source" :position="Position.Right" :is-valid-connection="isValidConnection" />
    <div v-show="popupOpen" class="imageNodeFloat" @click.stop @mousedown.stop @wheel.stop>
      <VueDraggable v-if="imageInputs.length" v-model="orderedIndices" :animation="150" class="refList f">
        <div class="item" v-for="origIdx in orderedIndices" :key="origIdx">
          <img v-if="imageInputs[origIdx]?.url" :src="imageInputs[origIdx]!.url" class="smallImage" alt="" />
          <div v-else class="itemEmpty"><t-icon name="image" size="24px" /></div>
        </div>
      </VueDraggable>
      <div v-else class="refList f">
        <div class="refListEmpty">
          <t-icon name="image" size="20px" />
        </div>
      </div>
      <div class="input">
        <mentionInput :list="fileList" v-model="prompt" placeholder="请输入提示词" />
      </div>
      <div class="operate jb">
        <div class="ac">
          <modelSelect v-model="data!.model" type="image" size="small" />
          <t-select v-model="data!.ratio" class="paramSelect ml-5" size="small" :placeholder="$t('workbench.production.editImage.ratio')">
            <t-option value="16:9" label="16:9" />
            <t-option value="9:16" label="9:16" />
            <t-option value="1:1" label="1:1" />
          </t-select>
          <t-select v-model="data!.quality" class="paramSelect ml-5" size="small" :placeholder="$t('workbench.production.editImage.quality')">
            <t-option value="1K" label="1K" />
            <t-option value="2K" label="2K" />
            <t-option value="4K" label="4K" />
          </t-select>
        </div>
        <div class="f" style="gap: 5px; margin-left: 5px">
          <t-popup :content="$t('workbench.production.editImage.generateBtn')">
            <t-button theme="primary" size="small" class="generateBtn" :disabled="generating" :loading="generating" @click="handleGenerate">
              <template #icon><i-arrow-up /></template>
            </t-button>
          </t-popup>
          <t-popup :content="$t('workbench.production.save')" v-if="selector?.types.includes('IMAGE')">
            <t-button theme="primary" size="small" class="keepBtn" :disabled="generating" :loading="generating" @click="handleKeep">
              <template #icon><i-save /></template>
            </t-button>
          </t-popup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow, type ValidConnectionFunc } from "@vue-flow/core";
import { MessagePlugin } from "tdesign-vue-next";
import { VueDraggable } from "vue-draggable-plus";
import mentionInput from "@/components/mentionInput.vue";
import modelSelect from "@/components/modelSelect.vue";
import { useToonflowUMD, type TargetHandleData } from "#/core";
import type { ImageData } from "#/core/nodeType";

interface Data {
  generatedImage?: string;
  references: { image: string }[];
  prompt: string;
  model?: string;
  ratio?: string;
  quality?: string;
  steps: number;
}

const sdk = useToonflowUMD();
// TODO(sdk): ai.generateFlowImage / selector / projectId 在新 SDK 中尚未暴露，临时通过 any 透传
const fn = sdk.fn as any;
const selector = (sdk as any).selector as { types: string[]; onSelect: (v: any) => void } | undefined;
const projectId = (sdk as any).projectId as { value: number } | undefined;

const data = sdk.getData<Data>();

function handleKeep() {
  if (!data.value?.generatedImage || !selector) return;
  selector.onSelect({ type: "IMAGE", value: { url: data.value.generatedImage } });
}

const { viewport } = useVueFlow(sdk.info.flowId);

const generating = ref(false);

const triggerRef = ref<HTMLElement | null>(null);
const popupOpen = ref(false);

// values/types 均为数组，支持 N 连 1
const { id: inputHandelId, value: mediaInputs } = sdk.register.handles.source<{ type: ["IMAGE"] }>("input", { type: ["IMAGE"] });
const { id: outputHandelId, value: outputValue } = sdk.register.handles.target<TargetHandleData<"IMAGE">>("output", {
  type: "IMAGE",
  value: null,
});

// 仅演示骨架：对输入值做 IMAGE 类型窄化
const imageInputs = computed(() => mediaInputs.value.map((h) => h?.value as ImageData | undefined));

const orderedIndices = ref<number[]>([]);

watch(
  () => mediaInputs.value.length,
  (len) => {
    orderedIndices.value = Array.from({ length: len }, (_, i) => i);
  },
  { immediate: true }
);

const sortedMediaInputs = computed(() => orderedIndices.value.map((i) => imageInputs.value[i]).filter(Boolean) as ImageData[]);

const fileList = computed(() =>
  sortedMediaInputs.value.map((val, i) => ({
    id: `${inputHandelId}_${i}`,
    label: `图${i + 1}`,
    type: "IMAGE",
    thumb: val?.url ?? "",
  }))
);

const prompt = computed({
  get: () => data.value?.prompt,
  set: (val) => {
    if (data.value) data.value.prompt = val ?? "";
  },
});

async function handleGenerate() {
  if (!data.value?.model) return window.$message.error($t("workbench.production.editImage.selectModel"));
  if (!data.value?.quality) return window.$message.error($t("workbench.production.editImage.selectQuality"));
  if (!data.value?.ratio) return window.$message.error($t("workbench.production.editImage.selectRatio"));
  generating.value = true;
  try {
    const { url } = await fn.ai.generateFlowImage({
      references: data.value?.references.map((i) => i.image).filter(Boolean),
      model: data.value?.model,
      quality: data.value?.quality,
      ratio: data.value?.ratio,
      prompt: data.value?.prompt,
      projectId: projectId?.value as number,
    });
    data.value!.generatedImage = url;
  } catch (e) {
    return window.$message.error((e as any)?.message || $t("workbench.production.editImage.generateFailed"));
  } finally {
    generating.value = false;
  }
}

// 弹层 teleport 到 body 的选择器，点击命中时不关闭浮窗
const teleportedPopupSelectors = [".tribute-container", ".t-popup"];

function onDocMousedown(e: MouseEvent) {
  if (!popupOpen.value) return;
  const target = e.target as Node;
  if (triggerRef.value?.contains(target)) return;
  if (teleportedPopupSelectors.some((sel) => (target as Element).closest?.(sel))) return;
  popupOpen.value = false;
}

onMounted(() => document.addEventListener("mousedown", onDocMousedown, true));
onUnmounted(() => document.removeEventListener("mousedown", onDocMousedown, true));

// 同步 fileList 到 data.references
watch(
  fileList,
  (val) => {
    if (data.value) data.value.references = val.map((i) => ({ image: i.thumb }));
  },
  { immediate: true }
);

// 同步 generatedImage 到输出 handle
watch(
  () => data.value?.generatedImage,
  (img) => {
    outputValue.value = {
      type: "IMAGE",
      value: img ? { url: img } : null,
    };
  },
  { immediate: true }
);

const isValidConnection: ValidConnectionFunc = (connection, elements) => {
  const { canConnect, failReason } = sdk.checkConnection({ connection, elements });
  if (!canConnect) MessagePlugin.warning(`连接失败：${failReason}`);
  return canConnect;
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
    display: flex;
    flex-direction: column;

    .refList {
      gap: 8px;
      min-height: 40px;
      align-items: center;

      .item {
        cursor: grab;
        user-select: none;
        &.sortable-ghost {
          opacity: 0.4;
        }
        .smallImage {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        .itemEmpty {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--td-brand-color-light);
          color: var(--td-brand-color);
        }
      }

      .refListEmpty {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: var(--td-brand-color-light);
        color: var(--td-brand-color);
      }
    }

    .input {
      flex: 1;
      min-height: 0;
      max-height: 300px;
      overflow: auto;
    }
    .operate {
      flex-shrink: 0;
      margin-top: auto;
      .paramSelect {
        min-width: 100px;
        width: 100px;
      }

      .ml-5 {
        margin-left: 5px;
      }

      .generateBtn {
        margin-left: auto;
        --td-brand-color: #5bccb3;
        --td-brand-color-hover: #4ab8a0;
      }
    }
  }
}
</style>
