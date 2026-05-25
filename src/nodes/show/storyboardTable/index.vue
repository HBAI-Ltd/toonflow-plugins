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
    data.value!.storyboardTable = raw ? (marked(raw) as string) : raw;
    data.value!.v = 1;
  }
}


</script>

<script lang="ts">
import logo from "@/assets/logo.jpg";

interface Data {
  storyboardTable: string;
  v?: number;
}

export const icon = logo;

export const defaultData: Data = {
  storyboardTable: "",
};
</script>

<style lang="scss" scoped>
.editorWrapper {
  width: 100%;
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
