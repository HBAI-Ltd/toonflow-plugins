import { computed, inject, onUnmounted, toValue, watchEffect, type ComputedRef, type InjectionKey, type MaybeRefOrGetter, type Ref } from "vue";
import { useNode, useVueFlow, type Edge, type ValidConnectionFunc } from "@vue-flow/core";
import checkConnection from "./checkConnection";
import type { HANDLE_TYPE, HANDLEDATA, HANDLEDOPT } from "./nodeType";

export * from "./nodeType";
export { checkConnection };

export const toonflowHostKey = "__toonflowHost__" as unknown as InjectionKey<ToonflowHost>;

export type ThemeMode = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface ToonflowSelector {
  types: HANDLE_TYPE[];
  onSelect<T extends HANDLE_TYPE>(data: HANDLEDATA<T>): void;
}

export interface ToonflowHost {
  flowId?: string;
  selector: ToonflowSelector | null;
  language: Ref<string>;
  themeMode: Ref<ThemeMode>;
  theme: Ref<ResolvedTheme>;
  episodesId?: Ref<string | number | undefined>;
  projectId?: Ref<string | number | undefined>;
  fn: PluginFn;
}

export interface InputHandleEntry<T = unknown> {
  type: HANDLE_TYPE | undefined;
  value: T | null;
}

const handleId = (nodeId: string, key: string) => `${nodeId}__${key}`;

export function useToonflowUMD() {
  const host = inject<ToonflowHost | null>(toonflowHostKey, null);
  if (!host) throw new Error("[useToonflowUMD] 宿主未注入，请调用 provide(toonflowHostKey, ...)");

  const { node } = useNode();
  const vueFlow = useVueFlow(host.flowId);

  const localHandleId = (key: string) => handleId(node.id, key);

  const incomingByHandle = computed(() => {
    const map = new Map<string, Edge[]>();
    for (const e of vueFlow.getEdges.value) {
      if (e.target !== node.id || !e.targetHandle) continue;
      const list = map.get(e.targetHandle);
      if (list) list.push(e);
      else map.set(e.targetHandle, [e]);
    }
    return map;
  });

  function inputValue<T = unknown>(input: MaybeRefOrGetter<string>): ComputedRef<InputHandleEntry<T>[]> {
    return computed(() => {
      const hId = toValue(input);
      const edges = incomingByHandle.value.get(hId);
      if (!edges) return [];
      return edges.flatMap((edge) => {
        if (!edge.sourceHandle) return [];
        const handle = vueFlow.findNode(edge.source)?.data?.handle as HANDLEDOPT | undefined;
        const output = handle?.outputs?.[edge.sourceHandle];
        if (!output) return [];
        return [{ type: output.type[0], value: (output.value ?? null) as T | null }];
      });
    });
  }

  const isValidConnection: ValidConnectionFunc = (connection, elements) => checkConnection({ connection, elements }).canConnect;

  function registerHandles(opt: MaybeRefOrGetter<HANDLEDOPT>) {
    watchEffect(() => {
      node.data.handle = toValue(opt);
    });
    onUnmounted(() => {
      node.data.handle = undefined;
    });
  }

  return {
    fn: host.fn,
    flowId: host.flowId,
    selector: host.selector,
    language: host.language,
    themeMode: host.themeMode,
    theme: host.theme,
    episodesId: host.episodesId,
    projectId:host.projectId,
    handleId: localHandleId,
    inputValue,
    isValidConnection,
    registerHandles,
  };
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface AssetsApi {
  insert(data: Record<string, any>): Promise<ApiResponse>;
  update(data: Record<string, any> & { id: number }): Promise<ApiResponse>;
  del(id: number | number[]): Promise<ApiResponse>;
  list(params?: Record<string, any>): Promise<ApiResponse>;
  item(id: number): Promise<ApiResponse<any>>;
  updateAssetsUrl(id: number, url: string, flowId: number): Promise<void>;
}

export interface FlowApi {
  insert(data: { id?: number; flowData: string }): Promise<ApiResponse>;
  update(data: { id: number; flowData?: string }): Promise<ApiResponse>;
  del(id: number | number[]): Promise<ApiResponse>;
  list(params?: { id?: number; page?: number; limit?: number }): Promise<ApiResponse>;
  item(id: number): Promise<ApiResponse>;
}

export type AssetType = "role" | "tool" | "scene" | "clip" | "audio";
export type ClipMediaType = "image" | "video" | "audio";

export interface AssetsSelectOptions {
  types?: AssetType[];
  clipMediaTypes?: ClipMediaType[];
  multiple?: boolean;
  title?: string;
  selectorMode?: boolean;
}

export interface StoryboardSelectOptions {
  multiple?: boolean;
  scriptId?: number;
}

export interface StoryboardItem {
  id: number;
  imageUrl: string;
  intro: string;
  name: string;
  imgPrompt: string;
  videoPrompt: string;
}

export interface OpenEditorConfig {
  flowId: string | number;
  selectorMode?: HANDLE_TYPE[];
}

export type HandleDataUnion = { [T in HANDLE_TYPE]: HANDLEDATA<T> }[HANDLE_TYPE];

export interface UiApi {
  openEditor(config: OpenEditorConfig): Promise<HandleDataUnion | null>;
  openAssetManager(options?: AssetsSelectOptions): Promise<any[]>;
  openStoryboardImageCheck(options?: StoryboardSelectOptions): Promise<StoryboardItem[]>;
}

export type ModelType = "text" | "image" | "all" | "video";

export interface ModelItem {
  id: number;
  label: string;
  value: string;
  vendorId: number;
  type: string;
}

export interface ModelGroup {
  group: string;
  id: number;
  children: ModelItem[];
}

export interface GenerateFlowImageParams {
  model: string;
  quality: string;
  ratio: string;
  prompt?: string;
  references?: string[];
  projectId: number;
}

export interface AiApi {
  getModelList(type: ModelType): Promise<ModelGroup[]>;
  getModelDetail(modelId: string): Promise<any>;
  getModelIcon(label?: string, value?: string): string | null;
  generateFlowImage(params: GenerateFlowImageParams): Promise<{ url: string }>;
}

export interface PluginFn {
  assets: AssetsApi;
  flow: FlowApi;
  ui: UiApi;
  ai: AiApi;
}
