<template>
  <div class="remoteNodeWrap">'
    <Child />
    <!-- <Handle type="target" :position="Position.Left" /> -->
    <div class="remoteNodeContent">
      <span class="remoteNodeLabel">🚀 远程节点1231231231312</span>
      <p class="remoteNodeText">{{ data.text }}</p>
    </div>
    <!-- <Handle type="source" :position="Position.Right" /> -->
  </div>
</template>
<script setup lang="ts">
import Child from './child.vue'
// import { Handle, Position } from "@vue-flow/core";

defineProps<{
  data: { text: string };
}>();
</script>

<style scoped>
.remoteNodeWrap {
  padding: 4px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.remoteNodeContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border-radius: 6px;
  min-width: 120px;
}

.remoteNodeLabel {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.remoteNodeText {
  font-size: 12px;
  color: #666;
  margin: 4px 0 0;
}
</style>
