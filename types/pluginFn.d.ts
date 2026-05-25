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
  [key: string]: any;
}

interface AssetsListParams {
  projectId?: number;
  type?: string;
  name?: string;
  scriptId?: number;
  assetsId?: number | null;
  page?: number;
  limit?: number;
  [key: string]: any;
}

interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

interface AssetsApi {
  /** 新增资产 */
  insert(data: AssetsData): Promise<ApiResponse>;
  /** 更新资产，data 必须包含 id */
  update(data: AssetsData & { id: number }): Promise<ApiResponse>;
  /** 删除资产，支持单个 id 或 id 数组 */
  del(id: number | number[]): Promise<ApiResponse>;
  /** 资产列表 */
  list(params?: AssetsListParams): Promise<ApiResponse>;
}

interface pluginFn {
  assets: AssetsApi;
}

export {};
