import { ShowNode, EditNode } from "#/core/nodeType";
import manifest from "#/manifest";
import { onUnmounted, ref, watch } from "vue";

export default (config: ShowNode | EditNode) => {
  const data = ref(config.data);

  // 标记数据来源：来自父级同步的更新不应再回传父级，避免回声循环
  let syncingFromParent = false;

  // 监听父级下发的数据，同步到本地 data
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;
    if (!message || message.type !== "UPDATE_DATA") return;

    const payload = message.payload;
    // 仅处理属于当前节点的消息
    if (!payload || payload.manifestName !== manifest.name || payload.id !== config.id) {
      return;
    }

    syncingFromParent = true;
    data.value = payload.data;
  };

  window.addEventListener("message", handleMessage);

  // 监听本地数据变化，回传父级
  watch(
    () => data.value,
    (newData) => {
      // 父级同步过来的更新跳过回传
      if (syncingFromParent) {
        syncingFromParent = false;
        return;
      }

      window.parent.postMessage(
        {
          type: "UPDATE_DATA",
          payload: {
            manifestName: manifest.name,
            id: config.id,
            data: newData,
          },
        },
        "*",
      );
    },
    { deep: true },
  );

  // 组件销毁时卸载事件监听，避免内存泄漏
  onUnmounted(() => {
    window.removeEventListener("message", handleMessage);
  });

  return { data };
};
