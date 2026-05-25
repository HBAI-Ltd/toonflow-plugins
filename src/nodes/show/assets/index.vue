<template>
  <div class="assets">
    <t-empty v-if="!data?.assets?.length" description="暂无资产" />
    <div v-for="(asset, assetIndex) in data?.assets" :key="asset.id" class="block">
      <div class="row main">
        <t-image :src="withSize(asset.src, 30)" fit="cover" class="thumb thumbLg" @click="preview(asset.src)">
          <template #loading><t-loading size="small" /></template>
        </t-image>
        <div class="info">
          <div class="name" @mousedown.left.stop>{{ asset.name || "未命名" }}</div>
          <div class="desc" v-if="asset.desc">{{ asset.desc }}</div>
          <div class="tags">
            <t-tag size="small" variant="light" :theme="TYPE_THEME[asset.type]">{{ TYPE_LABEL[asset.type] }}</t-tag>
            <t-tag size="small" variant="light-outline" :theme="STATE_THEME[asset.state]">{{ asset.state }}</t-tag>
          </div>
        </div>
        <div class="actions">
          <t-icon name="edit" size="18px" class="act" title="编辑资产" @click="edit(asset)" />
          <t-icon name="close" size="18px" class="act danger" title="删除资产" @click="remove(asset)" />
        </div>
      </div>

      <div v-if="asset.derive?.length" class="derive">
        <div v-for="(derive, deriveIndex) in asset.derive" :key="derive.id" class="row sub">
          <t-image :src="withSize(derive.src, 20)" fit="cover" lazy class="thumb thumbSm" @click="preview(derive.src)">
            <template #loading><t-loading size="small" /></template>
          </t-image>
          <div class="info">
            <div class="name" @mousedown.left.stop>{{ derive.name || "未命名" }}</div>
            <div class="tags">
              <t-tag size="small" variant="light" :theme="TYPE_THEME[derive.type]">{{ TYPE_LABEL[derive.type] }}</t-tag>
              <t-tag size="small" variant="light-outline" :theme="STATE_THEME[derive.state]">{{ derive.state }}</t-tag>
            </div>
          </div>
          <div class="actions">
            <t-icon name="edit" size="16px" class="act" @click="edit(asset, derive)" />
            <t-icon name="close" size="16px" class="act danger" @click="remove(asset, derive)" />
          </div>
        </div>
      </div>
    </div>
    <t-image-viewer v-model:visible="previewVisible" :images="previewImages" />
  </div>
</template>

<script setup lang="ts">
import { DialogPlugin } from "tdesign-vue-next";

const data = defineModel<Data>("DATA");

const previewVisible = ref(false);
const previewImages = ref<string[]>([]);
/** 给图片 URL 追加 `size` 查询参数,size 为百分比 (1-100),不传则返回原图 */
function withSize(src: string, size?: number) {
  if (!src || !size) return src;
  return src + (src.includes("?") ? "&" : "?") + "size=" + size;
}
function preview(src: string) {
  if (!src) return;
  previewImages.value = [withSize(src)];
  previewVisible.value = true;
}

const TYPE_LABEL: Record<AssetType, string> = {
  role: "角色",
  tool: "道具",
  scene: "场景",
  clip: "片段",
};
const TYPE_THEME: Record<AssetType, TagTheme> = {
  role: "primary",
  tool: "warning",
  scene: "success",
  clip: "default",
};
const STATE_THEME: Record<AssetState, TagTheme> = {
  未生成: "default",
  生成中: "primary",
  已完成: "success",
  生成失败: "danger",
};

async function remove(asset: Asset, derive?: DeriveAsset) {
  const confirmText = derive
    ? `确定删除衍生「${derive.name || "未命名"}」吗?`
    : `确定删除资产「${asset.name || "未命名"}」${asset.derive?.length ? `及其 ${asset.derive.length} 个衍生` : ""}吗?`;

  const ok = await new Promise<boolean>((resolve) => {
    const dialog = DialogPlugin.confirm({
      header: "删除确认",
      body: confirmText,
      theme: "warning",
      confirmBtn: { content: "删除", theme: "danger" },
      onConfirm: () => {
        dialog.destroy();
        resolve(true);
      },
      onClose: () => {
        dialog.destroy();
        resolve(false);
      },
    });
  });
  if (!ok) return;

  const ids = derive ? derive.id : [asset.id, ...(asset.derive?.map((d) => d.id) ?? [])];
  try {
    const res = await window.$pluginFn.assets.del(ids);
    if (res.code !== 200) {
      window.$message?.error(res.message || "删除失败");
      return;
    }
    if (derive) {
      const i = asset.derive.indexOf(derive);
      if (i > -1) asset.derive.splice(i, 1);
    } else {
      const i = data.value?.assets.indexOf(asset) ?? -1;
      if (i > -1) data.value!.assets.splice(i, 1);
    }
    window.$message?.success("删除成功");
  } catch (e: any) {
    window.$message?.error(e?.message || "删除失败");
  }
}

// TODO: 实现编辑逻辑
function edit(asset: Asset, derive?: DeriveAsset) {
  const target = derive ?? asset;
  console.log("%c edit target", "background:#465975", target);
  window.$message?.info(derive ? "编辑衍生功能待开发" : "编辑资产功能待开发");
}


</script>

<script lang="ts">
import logo from "@/assets/logo.jpg";

type AssetType = "role" | "tool" | "scene" | "clip";
type AssetState = "未生成" | "生成中" | "已完成" | "生成失败";
type TagTheme = "default" | "primary" | "success" | "warning" | "danger";

interface DeriveAsset {
  id: number;
  assetsId: number | null;
  name: string;
  prompt: string;
  desc: string;
  src: string;
  flowId?: number;
  state: AssetState;
  type: AssetType;
  errorReason?: string;
}

interface Asset {
  id: number;
  name: string;
  desc: string;
  prompt: string;
  src: string;
  state: AssetState;
  type: AssetType;
  flowId?: number;
  derive: DeriveAsset[];
  errorReason?: string;
}

interface Data {
  assets: Asset[];
}

export const icon = logo;

export const defaultData: Data = {
  assets: [],
};
</script>

<style lang="scss" scoped>
.assets {
  width: 550px;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.block {
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 6px;
  padding: 10px;
}
.thumb {
  border-radius: 4px;
  flex-shrink: 0;
  cursor: zoom-in;

  &.thumbLg {
    width: 72px;
    height: 72px;
  }
  &.thumbSm {
    width: 48px;
    height: 48px;
  }
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .name {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .desc {
    font-size: 12px;
    color: var(--td-text-color-secondary, #888);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tags {
    display: flex;
    gap: 4px;
  }
  .actions {
    display: flex;
    gap: 2px;
    align-self: flex-start;
  }
  .act {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 16px;
    color: var(--td-text-color-secondary, #888);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--td-bg-color-component-hover, #eef0f3);
      color: var(--td-brand-color, #0052d9);
    }
    &.danger:hover {
      background: var(--td-error-color-1, #fde2e2);
      color: var(--td-error-color, #d54941);
    }
  }
  &.sub {
    .name {
      font-size: 13px;
      font-weight: normal;
    }
  }
}
.derive {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--td-component-border, #e7e7e7);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
