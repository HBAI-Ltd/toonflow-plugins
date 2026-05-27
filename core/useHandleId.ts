import { inject } from "vue";

/**
 * 宿主通过 provide("genHandleId", fn) 注入。
 * 节点内部用本地 key（如 "input" / "output_image"）换取一个全局唯一且可预测的 handleId，
 * 以便宿主能在加载节点之前预制 edge。
 */
export type GenHandleId = (localKey: string) => string;

export function useHandleId(localKey: string): string {
  const gen = inject<GenHandleId | null>("genHandleId", null);
  if (!gen) throw new Error("[useHandleId] 宿主未通过 provide('genHandleId', ...) 注入 handleId 生成器");
  return gen(localKey);
}
