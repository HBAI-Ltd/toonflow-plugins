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
import { useToonflowUMD } from "#/core";

interface Data {
  script: string;
  v?: number;
}

registerTgModule();

const sdk = useToonflowUMD();

const data = sdk.getData<Data>();

const editorRef = shallowRef<IDomEditor>();

const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: ["bold", "italic", "underline", "through", "color", "bgColor", "fontSize", "bulletedList", "numberedList", "undo", "redo"],
};

const valueHtml = computed({
  get() {
    return data.value.script;
  },
  set(val) {
    data.value.script = val;
  },
});

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
  // v 字段为 1 表示已迁移为 HTML，缺失时视为旧 markdown 数据，做一次性转换
  if (!data.value.v) {
    const raw = data.value.script;
    data.value.script = raw ? (marked(raw) as string) : raw;
    data.value.v = 1;
  }
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
