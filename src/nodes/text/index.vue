<template>
  <div class="numberNode">
    <Handle :id="inputHandelId" type="target" :position="Position.Left" />
    <t-card size="small">
      <pre class="debug">{{ nodeProps }}</pre>
      <t-input-number v-model="data!.value" size="small" />
      {{ data }}
    </t-card>
    <Handle :id="outputHandelId" type="source" :position="Position.Right" />
  </div>
</template>

<script lang="ts">
import type { METADATA } from "#/core/nodeType";
import logo from "@/assets/logo.jpg";
import { v4 as uuid } from "uuid";

interface Data {
  value: number;
}

const inputHandelId = uuid();
const outputHandelId = uuid();

export const metaData: METADATA = {
  icon: logo,
  name: "数字节点",
  sources: ["show"],
  defaultData: { value: 0 } as Data,
  inputs: { [inputHandelId]: { type: "NUMBER", value: undefined } },
  outputs: { [outputHandelId]: { type: "NUMBER", value: undefined } },
};
</script>

<script setup lang="ts">
import { Handle, Position, type NodeProps } from "@vue-flow/core";

const nodeProps = defineModel<NodeProps>("nodeProps");

const data = defineModel<Data>("DATA");

defineExpose({
  NODE: (): METADATA => metaData,
});
</script>

<style lang="scss" scoped>
.numberNode {
  width: 300px;
  .debug {
    width: 100%;
    margin: 0 0 8px;
    padding: 6px;
    border-radius: 4px;
    font-size: 11px;
    line-height: 1.3;
    color: #6b7280;
    background: #f3f4f6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
