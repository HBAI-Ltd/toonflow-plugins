import { type HANDLE_TYPE, HANDLEDOPT } from "./nodeType";
import { type ValidConnectionFunc } from "@vue-flow/core";

export enum ConnectFailReason {
  // 目标端口与源端口相同
  sameHandle = "sameHandle",
  // 不允许自环连接
  selfLoop = "selfLoop",
  // 端口类型不兼容
  typeMismatch = "typeMismatch",
  // 连接方向错误（source→source 或 target→target）
  sameHandleDirection = "sameHandleDirection",
}

interface Config {
  connection: Parameters<ValidConnectionFunc>[0];
  elements?: Parameters<ValidConnectionFunc>[1];
  /** true 时禁止自环连接，默认 true */
  selfLoop?: boolean;
  /** true 时强制 output→input 方向，禁止 source→source 或 target→target，默认 true */
  strictDirection?: boolean;
}

interface ConnectResult {
  canConnect: boolean;
  failReason?: ConnectFailReason;
}

interface NodeData {
  pluginId: string;
  data: Record<string, any>;
  handle: HANDLEDOPT;
}

function isTypesCompatible(sourceTypes: HANDLE_TYPE[], targetTypes: HANDLE_TYPE[]): boolean {
  if (sourceTypes.includes("ANY") || targetTypes.includes("ANY")) return true;
  return sourceTypes.some((t) => targetTypes.includes(t));
}

export default (config: Config): ConnectResult => {
  const { connection, elements, selfLoop = true, strictDirection = true } = config;

  if (connection.targetHandle === connection.sourceHandle) return { canConnect: false, failReason: ConnectFailReason.sameHandle };

  if (selfLoop && connection.source === connection.target) return { canConnect: false, failReason: ConnectFailReason.selfLoop };

  if (elements) {
    const { sourceNode, targetNode } = elements;
    const sourceData = sourceNode.data as NodeData;
    const targetData = targetNode.data as NodeData;

    if (strictDirection && connection.sourceHandle && connection.targetHandle) {
      const srcIsOutput = sourceNode.handleBounds?.source?.some((h) => h.id === connection.sourceHandle) ?? true;
      const tgtIsInput = targetNode.handleBounds?.target?.some((h) => h.id === connection.targetHandle) ?? true;
      if (!srcIsOutput || !tgtIsInput) {
        return { canConnect: false, failReason: ConnectFailReason.sameHandleDirection };
      }
    }

    if (connection.sourceHandle && connection.targetHandle) {
      const sourceOutput = sourceData?.handle?.outputs?.[connection.sourceHandle];
      const sourceTypes = sourceOutput?.type;
      const targetTypes = targetData?.handle?.inputs?.[connection.targetHandle];

      if (sourceTypes && targetTypes && !isTypesCompatible(sourceTypes, targetTypes)) {
        return { canConnect: false, failReason: ConnectFailReason.typeMismatch };
      }
    }
  }

  return { canConnect: true };
};
