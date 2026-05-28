<template>
  <div class="editorWrapper" @mousedown.left.stop @wheel.stop>
    <Toolbar class="editorToolbar" :editor="editorRef" :defaultConfig="toolbarConfig" mode="simple" />
    <Editor class="editorContent" v-model="valueHtml" @onCreated="handleCreated" mode="simple" />
  </div>
</template>

<script setup lang="ts">
import { registerTgModule } from "@/utils/trackDom";
import { Boot, type IDomEditor, type IToolbarConfig } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import markdownModule from "@wangeditor/plugin-md";
import { marked } from "marked";

if (!(globalThis as any).__toonflowMdRegistered) {
  Boot.registerModule(markdownModule);
  (globalThis as any).__toonflowMdRegistered = true;
}

interface Data {
  storyboardTable: string;
  v?: number;
}

registerTgModule();

const editorRef = shallowRef<IDomEditor>();

const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    "insertTable",
    "deleteTable",
    "insertTableRow",
    "deleteTableRow",
    "insertTableCol",
    "deleteTableCol",
    "tableHeader",
    "|",
    "bold",
    "italic",
    "underline",
    "color",
    "|",
    "undo",
    "redo",
  ],
};

const data = defineModel<Data>("DATA");

const valueHtml = computed({
  get() {
    return data.value!.storyboardTable;
  },
  set(val) {
    data.value!.storyboardTable = val;
  },
});

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
  if (!data.value!.v) {
    const raw = data.value!.storyboardTable;
    if (raw) {
      editor.setHtml(marked(raw) as string);
    }
    data.value!.v = 1;
  }
}
</script>

<style lang="scss" scoped>
.editorWrapper {
  width: 500px;
  max-width: 1000px;
  height: 100%;
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
