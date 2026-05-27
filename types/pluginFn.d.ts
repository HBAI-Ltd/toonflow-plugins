type HANDLE_TYPE = "INT" | "FLOAT" | "STRING" | "BOOLEAN" | "IMAGE" | "MASK" | "AUDIO" | "VIDEO" | "LATENT" | "CONDITIONING" | "ANY";

interface HandleValueMap {
  INT: number;
  FLOAT: number;
  STRING: string;
  BOOLEAN: boolean;
  IMAGE: { url: string; name?: string; width?: number; height?: number; format?: "png" | "jpg" | "webp" | "gif" };
  MASK: { url: string; name?: string; width?: number; height?: number };
  AUDIO: { url: string; name?: string; duration?: number; sampleRate?: number; format?: "mp3" | "wav" | "flac" | "ogg" };
  VIDEO: { url: string; name?: string; duration?: number; fps?: number; width?: number; height?: number; format?: "mp4" | "webm" };
  LATENT: { url: string; width: number; height: number; batchSize?: number };
  CONDITIONING: { text: string; strength?: number };
  ANY: unknown;
}

interface HANDLEDATA<T extends HANDLE_TYPE = HANDLE_TYPE> {
  type: T;
  value: T extends keyof HandleValueMap ? HandleValueMap[T] : unknown;
}

declare global {
  interface Window {
    $pluginFn: pluginFn;
  }
}

interface AssetsData {
  id?: number;
  name?: string;
  type?: string;
  projectId?: number;
  describe?: string | null;
  prompt?: string | null;
  remark?: string | null;
  assetsId?: number | null;
  scriptId?: number | null;
  flowId?: number | null;
  imageId?: number | null;
  promptState?: string | null;
  audioBindState?: number | null;
  promptErrorReason?: string | null;
}

interface AssetsListParams {
  projectId?: number;
  type?: string;
  name?: string;
  scriptId?: number;
  assetsId?: number | null;
  page?: number;
  limit?: number;
}

interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

interface AssetsApi {
  // 新增资产
  insert(data: AssetsData): Promise<ApiResponse>;
  // 更新资产，data 必须包含 id
  update(data: AssetsData & { id: number }): Promise<ApiResponse>;
  // 删除资产，支持单个 id 或 id 数组
  del(id: number | number[]): Promise<ApiResponse>;
  // 资产列表
  list(params?: AssetsListParams): Promise<ApiResponse>;
  // 获取资产详情
  item: (id: number) => Promise<ApiResponse<AssetsData>>;
  //更新资产图片
  updateAssetsUrl(id: number, url: string, flowId: number): Promise<void>;
}

interface FlowData {
  id?: number;
  flowData?: string;
}

interface FlowApi {
  // 新增工作流
  insert(data: FlowData & { flowData: string }): Promise<ApiResponse>;
  // 更新工作流，data 必须包含 id
  update(data: FlowData & { id: number }): Promise<ApiResponse>;
  // 删除工作流，支持单个 id 或 id 数组
  del(id: number | number[]): Promise<ApiResponse>;
  // 工作流列表
  list(params?: { id?: number; page?: number; limit?: number }): Promise<ApiResponse>;
}

type AssetType = "role" | "tool" | "scene" | "clip" | "audio";
type ClipMediaType = "image" | "video" | "audio";

interface Asset {
  id: number;
  assetsId: number | null;
  name: string;
  prompt: string;
  describe: string;
  remark: string;
  src: string;
  type: AssetType;
  imageId: number | null;
  state: "未生成" | "生成中" | "已完成" | "生成失败";
  sonAssets?: Asset[];
}

interface AssetsSelectOptions {
  // 限制显示的资产类型，不传则显示全部
  types?: AssetType[];
  // 当 types 包含 clip 时，限制 clip 的媒体子类型，不传则显示全部
  clipMediaTypes?: ClipMediaType[];
  // 是否多选，默认 true
  multiple?: boolean;
  // 弹窗标题
  title?: string;
  selectorMode?: boolean;
}

interface StoryboardSelectOptions {
  // 是否多选，默认 false
  multiple?: boolean;
  // 指定剧本 ID，不传则显示剧本下拉选择
  scriptId?: number;
}

interface StoryboardItem {
  id: number;
  imageUrl: string;
  intro: string;
  name: string;
  imgPrompt: string;
  videoPrompt: string;
}

interface OpenEditorConfig {
  // 数据库中的 flowId（非 VueFlow 组件 id）
  flowId: string | number;
  // 是否开启选择模式
  selectorMode?: HANDLE_TYPE[];
}

type HandleDataUnion = { [T in HANDLE_TYPE]: HANDLEDATA<T> }[HANDLE_TYPE];

interface UiApi {
  // 打开流程编辑器：普通模式返回 void；选择模式返回 HANDLEDATA 或 null
  openEditor(config: OpenEditorConfig): Promise<HandleDataUnion | null>;
  // 打开资产选择弹窗
  openAssetManager(options?: AssetsSelectOptions): Promise<Asset[]>;
  // 打开分镜图片确认弹窗
  openStoryboardImageCheck(options?: StoryboardSelectOptions): Promise<StoryboardItem[]>;
}

type ModelType = "text" | "image" | "all" | "video";

interface ModelItem {
  id: number;
  label: string;
  value: string;
  vendorId: number;
  type: string;
}

interface ModelGroup {
  group: string;
  id: number;
  children: ModelItem[];
}

interface AiApi {
  // 获取模型列表（按供应商分组）
  getModelList(type: ModelType): Promise<ModelGroup[]>;
  // 获取模型详情
  getModelDetail(modelId: string): Promise<any>;
  // 根据模型 label/value 获取供应商图标（base64 或资源 URL），匹配不到时返回 null
  getModelIcon(label?: string, value?: string): string | null;
  // 调用流程图生成图像，返回生成结果的图片 URL
  generateFlowImage(params: GenerateFlowImageParams): Promise<{ url: string }>;
}

interface GenerateFlowImageParams {
  model: string;
  quality: string;
  ratio: string;
  prompt?: string;
  references?: string[];
}

interface pluginFn {
  assets: AssetsApi;
  flow: FlowApi;
  ui: UiApi;
  ai: AiApi;
}

export {};
