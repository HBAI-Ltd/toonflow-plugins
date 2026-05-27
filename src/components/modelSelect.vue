<template>
  <t-select
    :size="props.size"
    v-model="selectValue"
    :placeholder="props.placeholder ?? '请选择模型'"
    @change="onChange"
    @popup-visible-change="onPopupVisibleChange">
    <t-option-group v-for="(list, index) in optionsData" :key="index" :label="list.group">
      <t-option v-for="item in list.children" :key="item.id" :value="`${item.id}:${item.value}`" :label="item.label">
        <div class="optionItem">
          <div class="optionMain">
            <t-avatar
              v-if="getModelIcon(item.label, item.value)"
              size="24px"
              shape="round"
              :image="getModelIcon(item.label, item.value)!" />
            <t-avatar v-else size="24px" shape="round" class="fallbackAvatar">{{ item.label?.slice(0, 1)?.toUpperCase() || 'M' }}</t-avatar>
            <div class="optionLabel">{{ item.label }}</div>
          </div>
          <span class="optionType">{{ item.type }}</span>
        </div>
      </t-option>
    </t-option-group>
    <template #empty>无可用模型时，请先配置</template>
  </t-select>
</template>

<script setup lang="ts">
interface VendorChild {
  id: number;
  label: string;
  value: string;
  vendorId: number;
  type: string;
}

interface VendorOption {
  group: string;
  id: number;
  children: VendorChild[];
}
const selectValue = defineModel({
  type: String,
  default: "",
});

const selectValueLabel = defineModel("label");

const props = defineProps({
  type: {
    type: String as () => "text" | "image" | "all" | "video",
    default: "all",
  },
  size: {
    type: String as () => "small" | "medium" | "large",
    default: "medium",
  },
  placeholder: {
    type: String,
  },
  changeConfig: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits<{
  change: [value: string, data?: any];
}>();

async function onChange(value: any, { option }: any) {
  selectValue.value = value;
  selectValueLabel.value = option.label;
  if (props.changeConfig) {
    const data = await window.$pluginFn.ai.getModelDetail(value);
    emit("change", value, data);
  } else {
    emit("change", value);
  }
}
const optionsData = ref<VendorOption[]>([]);
onMounted(() => {
  handleModelChange();
});

function onPopupVisibleChange(visible: boolean) {
  if (visible) {
    handleModelChange();
  }
}
const titleMap = {
  image: "图像",
  text: "文本",
  video: "视频",
};
//获取模型选择API数据
function handleModelChange() {
  window.$pluginFn.ai
    .getModelList(props.type)
    .then((data) => {
      optionsData.value = data.map((group) => ({
        ...group,
        children: group.children.map((item) => ({
          ...item,
          type: titleMap[item.type as "image" | "text" | "video"],
        })),
      }));

      if (
        optionsData.value
          .map((i) => i.children)
          .flat()
          .every((i) => `${i.id}:${i.value}` !== selectValue.value)
      ) {
        selectValue.value = "";
      }
    })
    .catch((error) => {
      console.error("获取模型列表失败", error);
    });
}
function getModelIcon(label?: string, value?: string) {
  return window.$pluginFn.ai.getModelIcon(label, value);
}
</script>

<style lang="scss" scoped>
.optionItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.optionMain {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.optionLabel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.optionType {
  color: var(--td-text-color-secondary);
  flex-shrink: 0;
}

.fallbackAvatar {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.emptyActionWrap {
  display: flex;
  justify-content: center;
  padding: 8px 12px;
  .emptyActionButton {
    min-width: 140px;
    color: #339af0;
  }
}
</style>
