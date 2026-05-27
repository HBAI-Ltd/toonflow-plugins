<template>
  <div class="mentionInput">
    <div
      ref="editorRef"
      class="mentionEditor"
      contenteditable="true"
      :placeholder="placeholder"
      @input="syncText"
      @keydown="handleKeydown"
      spellcheck="false" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, onBeforeUnmount, watch, nextTick, render } from "vue";
import Tribute from "tributejs";
import "tributejs/dist/tribute.css";

interface MentionItem {
  id: string;
  label: string;
  type: string;
  thumb?: string;
}

const props = defineProps<{
  list: MentionItem[];
  placeholder?: string;
  trigger?: string;
}>();

const text = defineModel<string>();
const editorRef = ref<HTMLDivElement | null>(null);
let tribute: Tribute<MentionItem> | null = null;

const emit = defineEmits<{
  (e: "update:text", value: string): void;
  (e: "mention", item: MentionItem): void;
}>();

const toHtml = (vnode: ReturnType<typeof h>): string => {
  const el = document.createElement("div");
  render(vnode, el);
  const html = el.innerHTML;
  render(null, el);
  return html;
};

const renderTag = (d: MentionItem) =>
  h("span", { class: "mentionTag", contenteditable: "false", "data-id": d.id, "data-type": d.type }, [
    d.thumb ? h("img", { class: "mentionTagIcon", src: d.thumb, alt: d.label }) : null,
    h("span", { class: "mentionTagLabel" }, d.label),
  ]);

const initTribute = () => {
  tribute = new Tribute({
    trigger: props.trigger ?? "@",
    requireLeadingSpace: false,
    values: props.list,
    lookup: "label",
    fillAttr: "label",
    menuItemTemplate: (item) =>
      toHtml(
        h("div", { class: "mentionMenuItem" }, [
          ...[item.original.thumb ? h("img", { class: "mentionThumb", src: item.original.thumb, alt: item.original.label }) : null],
          h("span", { class: "mentionLabel" }, item.original.label),
          h("span", { class: "mentionType" }, item.original.type),
        ])
      ),
    selectTemplate: (item) => (item ? toHtml(renderTag(item.original)) : ""),
    noMatchTemplate: () => toHtml(h("li", { class: "mentionNoMatch" }, "无匹配结果")),
  });
  if (editorRef.value) tribute.attach(editorRef.value);
};

const extractText = (el: HTMLElement): string => {
  let r = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      r += node.textContent || "";
    } else if (node instanceof HTMLElement) {
      r += node.classList.contains("mentionTag") ? `@${node.getAttribute("data-id") || node.textContent}` : extractText(node);
    }
  }
  return r;
};

let syncingFromUser = false;

const syncText = () => {
  if (!editorRef.value) return;
  syncingFromUser = true;
  text.value = extractText(editorRef.value);
  emit("update:text", text.value);
  syncingFromUser = false;
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key !== "Backspace" && e.key !== "Delete") return;
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const { collapsed, startContainer: sc, startOffset: so } = sel.getRangeAt(0);
  if (!collapsed) return;

  const target =
    e.key === "Backspace"
      ? sc === editorRef.value
        ? sc.childNodes[so - 1]
        : so === 0
        ? sc.previousSibling
        : null
      : sc === editorRef.value
      ? sc.childNodes[so]
      : so === (sc.textContent?.length ?? 0)
      ? sc.nextSibling
      : null;

  if (target instanceof HTMLElement && target.classList.contains("mentionTag")) {
    e.preventDefault();
    target.remove();
    syncText();
  }
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const setText = (value: string) => {
  if (!editorRef.value || !value) return;
  const map = new Map(props.list.map((i) => [i.id, i]));
  const ids = props.list.map((i) => i.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length);
  if (!ids.length) {
    editorRef.value.textContent = value;
    return;
  }
  let html = "",
    i = 0;
  while (i < value.length) {
    if (value[i] === "@") {
      let matched: MentionItem | null = null;
      let matchLen = 0;
      for (const id of ids) {
        if (value.startsWith(id, i + 1)) {
          const end = i + 1 + id.length;
          // id 后面必须是空格或到末尾才算匹配
          if (end >= value.length || value[end] === " ") {
            matched = map.get(id) || null;
            matchLen = id.length + 1 + (end < value.length ? 1 : 0); // +1 跳过空格
            break;
          }
        }
      }
      if (matched) {
        html += toHtml(renderTag(matched)) + "&nbsp;";
        i += matchLen;
      } else {
        html += escapeHtml(value[i]);
        i++;
      }
    } else {
      html += escapeHtml(value[i]);
      i++;
    }
  }
  editorRef.value.innerHTML = html;
};
const handleMentionSelect = (e: Event) => {
  const item = (e as CustomEvent).detail?.item?.original as MentionItem;
  if (item) emit("mention", item);
  syncText();
};

onMounted(() => {
  initTribute();
  editorRef.value?.addEventListener("tribute-replaced", handleMentionSelect);
  if (text.value) nextTick(() => setText(text.value!));
});

watch(text, (val) => {
  if (syncingFromUser || !editorRef.value) return;
  const current = extractText(editorRef.value);
  if ((val ?? "") !== current) {
    nextTick(() => setText(val ?? ""));
  }
});

watch(
  () => props.list,
  (v) => tribute?.append(0, v, true)
);

onBeforeUnmount(() => {
  editorRef.value?.removeEventListener("tribute-replaced", handleMentionSelect);
  if (tribute && editorRef.value) {
    tribute.detach(editorRef.value);
    tribute = null;
  }
});

defineExpose({
  text,
  setText,
  clear: () => {
    if (editorRef.value) {
      editorRef.value.innerHTML = "";
      text.value = "";
    }
  },
});
</script>

<style lang="scss" scoped>
.mentionInput {
  position: relative;
  width: 100%;

  .mentionEditor {
    outline: none;
    font-size: 15px;
    line-height: 1.8;

    &:focus {
      border-color: #409eff;
    }

    &:empty::before {
      content: attr(placeholder);
      color: #c0c4cc;
      pointer-events: none;
    }

    :deep(.mentionTag) {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 8px 1px 4px;
      margin: 0 2px;
      background: #ecf5ff;
      color: #409eff;
      border-radius: 4px;
      font-size: 13px;
      cursor: default;
      user-select: none;
      vertical-align: middle;
      max-width: 160px;

      .mentionTagLabel {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

      .mentionTagIcon {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
        pointer-events: none;
      }
    }
  }
}
</style>

<style lang="scss">
.tribute-container {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
  z-index: 9999;
  overflow: hidden;

  ul {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    max-height: 240px;
    overflow-y: auto;

    li {
      cursor: pointer;

      &.highlight,
      &:hover {
        background: #f5f7fa;
      }

      .mentionMenuItem {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        gap: 8px;

        .mentionThumb {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .mentionLabel {
          font-size: 14px;
          color: #303133;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mentionType {
          font-size: 12px;
          color: #909399;
          flex-shrink: 0;
        }
      }
    }
  }

  .mentionNoMatch {
    padding: 8px 12px;
    font-size: 13px;
    color: #909399;
    text-align: center;
    cursor: default;
  }
}
</style>
