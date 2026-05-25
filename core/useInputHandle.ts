import { computed, getCurrentInstance, isRef, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { useVueFlow, type NodeProps } from "@vue-flow/core";
import type { HANDLE_TYPE, HANDLEDOPT } from "./nodeType";

export interface InputHandleEntry<T = unknown> {
  type: HANDLE_TYPE | undefined;
  value: T | null | undefined;
}

/**
 * 监听指定输入 handle 所连接的所有上游输出（支持 N 连 1）。
 * 返回 ComputedRef<{type, value}[]>，每个元素对应一条连接。
 * nodeId 内部通过 $attrs.nodeProps 自动获取。
 */
export function useInputHandleValue<T = unknown>(
  flowId: string,
  inputHandleId: MaybeRefOrGetter<string>,
): ComputedRef<InputHandleEntry<T>[]> {
  const instance = getCurrentInstance();
  const { findNode, getEdges } = useVueFlow(flowId);

  return computed<InputHandleEntry<T>[]>(() => {
    const nId = (instance?.attrs.nodeProps as NodeProps | undefined)?.id;
    if (!nId) return [];
    const hId = toValue(inputHandleId);
    return getEdges.value
      .filter((e) => e.target === nId && e.targetHandle === hId)
      .flatMap((edge) => {
        if (!edge.sourceHandle) return [];
        const sourceNode = findNode(edge.source);
        // pluginNode.vue 将 Ref<HANDLEDOPT> 存入 node.data.handle，需兼容 Ref 和普通值
        const rawHandle = sourceNode?.data.handle;
        const handle = (isRef(rawHandle) ? rawHandle.value : rawHandle) as HANDLEDOPT | undefined;
        const output = handle?.outputs?.[edge.sourceHandle];
        if (!output) return [];
        return [{ type: output.type[0] as HANDLE_TYPE | undefined, value: (output.value ?? undefined) as T | null | undefined }];
      });
  });
}
