<template>
  <div class="">{{ data }}</div>
</template>

<script setup lang="ts">
import useNode from "@/useNode";

const data = useNode({
  sources: "production",
  id: "text",
  name: "文本",
  data: {
    text: "<h1>文本</h1>",
  },
});

</script>

<style lang="scss" scoped></style>
