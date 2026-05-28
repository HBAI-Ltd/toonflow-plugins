<template>
  <div class="editorWrapper" @mousedown.left.stop @wheel.stop>
    <Toolbar class="editorToolbar" :editor="editorRef" :defaultConfig="toolbarConfig" mode="simple" />
    <Editor class="editorContent" v-model="valueHtml" @onCreated="handleCreated" mode="simple" />
  </div>
</template>

<script setup lang="ts">
import { registerTgModule } from "@/utils/trackDom";
import type { IDomEditor, IToolbarConfig } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import { marked } from "marked";

registerTgModule();

const editorRef = shallowRef<IDomEditor>();

const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: ["bold", "italic", "underline", "through", "color", "bgColor", "fontSize", "bulletedList", "numberedList", "undo", "redo"],
};

const data = defineModel<Data>("DATA");

const valueHtml = computed({
  get() {
    return data.value!.scriptPlan;
  },
  set(val) {
    data.value!.scriptPlan = val;
  },
});

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
  if (!data.value!.v) {
    const raw = data.value!.scriptPlan;
    data.value!.scriptPlan = raw ? (marked(raw) as string) : raw;
    data.value!.v = 1;
  }
}


</script>

<script lang="ts">
interface Data {
  scriptPlan: string;
  v?: number;
}
</script>

<style lang="scss" scoped>
.editorWrapper {
  width: 550px;
  height: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: default;

  .editorToolbar {
    flex-shrink: 0;
    border-bottom: 1px solid #ccc;
  }

  .editorContent {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    cursor: text;

    :deep(.w-e-text-container) {
      height: 100% !important;
    }
  }

}
</style>

<style lang="scss">
@use "@/assets/track";
</style>
