import type { Knex } from "knex";
import { tool, Tool } from "ai";
import { z } from "zod";
import { useNode, useVueFlow, useNodeConnections, useNodesData, type ValidConnectionFunc } from "@vue-flow/core";
import type { DataType, DataTypeMap } from "./nodeType";

export interface ToonflowHost {
  baseUrl: Ref<string>;
  flowId: string;
  file: {
    get: (path: string) => Promise<{ data: string }>;
    write: (path: string, data: string) => Promise<void>;
    delete: (path: string) => Promise<void>;
  };
  sql: Knex;
  projectId: string;
  episodesId?: string;
}

export interface SourceHandleData<T extends DataType = DataType> {
  type: T[];
  value?: TargetHandleData<T>[];
}

export interface TargetHandleData<T extends DataType = DataType> {
  type: T;
  value?: DataTypeMap[T] | null;
}

export type HandleData<T extends DataType = DataType> = SourceHandleData<T> | TargetHandleData<T>;

export interface NodeData {
  pluginId: `${string}:${string}`;
  data: Record<string, any>;
  handles: Record<string, HandleData>;
}

export enum ConnectFailReason {
  sameHandle = "sameHandle",
  selfLoop = "selfLoop",
  typeMismatch = "typeMismatch",
  sameHandleDirection = "sameHandleDirection",
}

export interface Config {
  connection: Parameters<ValidConnectionFunc>[0];
  elements?: Parameters<ValidConnectionFunc>[1];
  selfLoop?: boolean;
  strictDirection?: boolean;
}

// 插件运行时入口，提供宿主能力、节点数据访问与连接校验
export function useToonflowUMD() {
  // 从宿主注入运行时上下文，未注入说明插件被独立运行
  const host = inject<ToonflowHost | null>("TOONFLOW_PROVIDE_UMD", null);
  if (!host) throw new Error("[useToonflowUMD] 宿主未注入TOONFLOW_PROVIDE_UMD");

  const vueFlow = useVueFlow(host.flowId);

  const currentodeId = inject<string>("NODE_ID");
  const { node } = useNode<NodeData>(currentodeId);

  // 获取节点实例，未传 id 时返回当前节点
  function getNode(nodeId?: string) {
    return nodeId ? useNode<NodeData>(nodeId).node : node;
  }

  // 获取节点的业务数据（data.data）
  function getData<T>(nodeId?: string) {
    const n = nodeId ? useNode<NodeData>(nodeId).node : node;
    return computed<T>(() => n.data.data as T);
  }

  // 获取节点所有 handle 的描述信息
  function getHandles(nodeId?: string) {
    const n = nodeId ? useNode<NodeData>(nodeId).node : node;
    return computed(() => n.data.handles);
  }

  // 注册输入端口
  function registerSourceHandle<C extends SourceHandleData>(id: string, config: C) {
    const handleId = `${currentodeId}-${id}-source`;
    if (!node.data.handles) node.data.handles = {};
    node.data.handles[handleId] = reactive(config) as C;

    const connections = useNodeConnections({
      nodeId: currentodeId,
      handleId: handleId,
      handleType: "target",
    });

    const parentNodeIds = computed(() => connections.value.map((conn) => conn.source));
    const nodeList = useNodesData(parentNodeIds);

    const handleList = computed(() =>
      connections.value.map((conn, index) => nodeList.value[index]?.data?.handles?.[conn.sourceHandle!] as TargetHandleData).filter(Boolean)
    );

    return { id: handleId, value: handleList };
  }

  // 注册输出端口
  function registerTargetHandle<C extends TargetHandleData>(id: string, config: C) {
    const handleId = `${currentodeId}-${id}-target`;
    if (!node.data.handles) node.data.handles = {};
    const reactiveConfig = reactive(config) as C;
    node.data.handles[handleId] = reactiveConfig;

    const outputValue = computed({
      get() {
        return node.data.handles?.[handleId] as C | undefined;
      },
      set(val) {
        if (node.data.handles && val) node.data.handles[handleId] = reactive(val) as C;
      },
    });

    return { id: handleId, value: outputValue };
  }

  // 校验连接合法
  function checkConnection(config: Config): { canConnect: boolean; failReason?: ConnectFailReason } {
    const { connection, elements, selfLoop = true, strictDirection = true } = config;
    const { source, target, sourceHandle, targetHandle } = connection;

    // 基础规则：同 handle / 自环 直接拒绝
    if (sourceHandle === targetHandle) return { canConnect: false, failReason: ConnectFailReason.sameHandle };
    if (selfLoop && source === target) return { canConnect: false, failReason: ConnectFailReason.selfLoop };
    if (!sourceHandle || !targetHandle) return { canConnect: true };

    // 严格方向：source 必须是输出端，target 必须是输入端
    if (strictDirection) {
      const srcIsOutput = sourceHandle.endsWith("-target");
      const tgtIsInput = targetHandle.endsWith("-source");
      if (!srcIsOutput || !tgtIsInput) return { canConnect: false, failReason: ConnectFailReason.sameHandleDirection };
    }

    const sourceNode = elements?.sourceNode ?? vueFlow.findNode<NodeData>(source);
    const targetNode = elements?.targetNode ?? vueFlow.findNode<NodeData>(target);
    if (!sourceNode || !targetNode) return { canConnect: true };

    // 类型兼容性校验：ANY 视为通配
    const sourceData = sourceNode.data?.handles?.[sourceHandle] as TargetHandleData | undefined;
    const targetData = targetNode.data?.handles?.[targetHandle] as SourceHandleData | undefined;
    const sourceType = sourceData?.type;
    const targetTypes = targetData?.type;
    if (sourceType && targetTypes && targetTypes.length) {
      const compatible = sourceType === "ANY" || targetTypes.includes("ANY") || targetTypes.includes(sourceType);
      if (!compatible) return { canConnect: false, failReason: ConnectFailReason.typeMismatch };
    }

    return { canConnect: true };
  }

  return {
    info: {
      flowId: host.flowId,
      projectId:host.projectId,
      episodesId:host.episodesId,
    },
    getNode,
    getData,
    getHandles,
    register: {
      tools: (fn: (a: typeof tool, b: typeof z) => Record<string, Tool>) => fn(tool, z),
      handles: {
        source: registerSourceHandle,
        target: registerTargetHandle,
      },
    },
    fn: {
      file: host.file,
      sql: host.sql,
    },
    checkConnection,
  };
}
