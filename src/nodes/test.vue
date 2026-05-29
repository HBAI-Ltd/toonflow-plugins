<template>
  <div class="test">
    <Handle :id="inputHandelId" type="target" :position="Position.Left" :is-valid-connection="isValidConnection" />
    <div class="testLayout">
      <!-- 左列：数据展示 -->
      <div class="testLeft">
        <div class="testSectionTitle">调试数据</div>
        <t-tabs default-value="node" class="testTabs">
          <t-tab-panel value="node" label="node">
            <textarea @wheel.stop @mousedown.stop class="testDataEdit" :value="JSON.stringify(node, null, 2)" readonly />
          </t-tab-panel>
          <t-tab-panel value="flow" label="flow">
            <textarea @wheel.stop @mousedown.stop class="testDataEdit" v-model="dataJson" />
          </t-tab-panel>
          <t-tab-panel value="handles" label="handles">
            <textarea @wheel.stop @mousedown.stop class="testDataEdit" :value="JSON.stringify(handleData, null, 2)" readonly />
          </t-tab-panel>
          <t-tab-panel value="input" label="输入">
            <textarea @wheel.stop @mousedown.stop class="testDataEdit" :value="JSON.stringify(inputValue, null, 2)" readonly />
          </t-tab-panel>
          <t-tab-panel value="output" label="输出">
            <textarea @wheel.stop @mousedown.stop class="testDataEdit" v-model="outputJson" />
          </t-tab-panel>
        </t-tabs>
      </div>

      <!-- 右列：操作区 -->
      <div class="testRight">
        <t-tabs default-value="handle" class="testRightTabs">
          <!-- Handle 信息 -->
          <t-tab-panel value="handle" label="Handle">
            <div class="testRightPanel">
              <div class="testSubTitle">输入 Handle</div>
              <div class="testHandleRow">
                <t-tag theme="primary" variant="light" size="small">input</t-tag>
                <span class="testHandleId">{{ inputHandelId }}</span>
              </div>
              <div class="testSubTitle">输出 Handle</div>
              <div class="testHandleRow">
                <t-tag theme="success" variant="light" size="small">output</t-tag>
                <span class="testHandleId">{{ outputHandelId }}</span>
              </div>
            </div>
          </t-tab-panel>

          <!-- Flow数据操作 -->
          <t-tab-panel value="flowData" label="Flow数据">
            <div class="testRightPanel">
              <div class="testSubTitle">showNumber 计数器</div>
              <div class="testCounter">
                <t-button theme="default" variant="outline" size="small" @click="data.showNumber--">-</t-button>
                <t-tag class="testCounterTag">{{ data.showNumber }}</t-tag>
                <t-button theme="default" variant="outline" size="small" @click="data.showNumber++">+</t-button>
              </div>
            </div>
          </t-tab-panel>

          <!-- 能力调用 -->
          <t-tab-panel value="fn" label="能力调用">
            <div class="testRightPanel">
              <div class="testSubTitle">fn.sql — o_image</div>
              <t-button theme="default" block size="small" @click="selectFnAssets">查询 o_image 资产</t-button>
              <div class="testSubTitle" v-if="fnResult !== null">查询结果</div>
              <textarea v-if="fnResult !== null" class="testDataEdit" :value="JSON.stringify(fnResult, null, 2)" readonly />
            </div>
          </t-tab-panel>

          <!-- 文件操作 -->
          <t-tab-panel value="file" label="文件操作">
            <div class="testRightPanel">
              <div class="testSubTitle">文件名</div>
              <t-input v-model="fileName" placeholder="文件名" size="small" />
              <div class="testSubTitle">内容（可编辑）</div>
              <textarea class="testDataEdit testDataEditSm" v-model="fileContent" placeholder="文件内容" />
              <div class="testFileActions">
                <t-button theme="primary" size="small" @click="fileWrite">写入</t-button>
                <t-button theme="default" size="small" @click="fileGet">读取</t-button>
                <t-button theme="danger" size="small" @click="fileDelete">删除</t-button>
              </div>
              <template v-if="fileReadResult !== null">
                <div class="testSubTitle">文件内容</div>
                <textarea class="testDataEdit testDataEditSm" :value="fileReadResult" readonly />
              </template>
            </div>
          </t-tab-panel>

          <!-- 事件示例 -->
          <t-tab-panel value="events" label="事件">
            <div class="testRightPanel">
              <div class="testSubTitle">@mousedown.stop — 防止拖拽节点</div>
              <div class="testDragArea" @mousedown.stop>拖拽此区域不会移动节点（mousedown.stop）</div>
              <div class="testSubTitle">@wheel.stop — 防止缩放画布</div>
              <div class="testScrollArea" @wheel.stop>
                <p v-for="i in 20" :key="i">滚动行 {{ i }}</p>
              </div>
            </div>
          </t-tab-panel>
        </t-tabs>
      </div>
    </div>
    <Handle :id="outputHandelId" type="source" :position="Position.Right" :is-valid-connection="isValidConnection" />
  </div>
</template>

<script setup lang="ts">
import { useToonflowUMD } from "#/core";
import { Handle, Position, type ValidConnectionFunc } from "@vue-flow/core";
import { MessagePlugin } from "tdesign-vue-next";

const sdk = useToonflowUMD();

interface Data {
  showNumber: number;
}

const node = sdk.getNode();

//获取节点数据，不传默认为当前节点
const data = sdk.getData<Data>();

//双向绑定JSON编辑器
const dataJson = computed({
  get: () => JSON.stringify(node.data.data, null, 2),
  set: (val: string) => {
    try {
      node.data.data = JSON.parse(val);
    } catch {}
  },
});

//注册Agent能力
sdk.register.tools((tool, z) => ({
  setShowNumberValue: tool({
    description: "设置showNumber值",
    inputSchema: z.object({ showNumber: z.number().describe("数字") }),
    execute: async ({ showNumber }) => {
      data.value.showNumber = showNumber;
    },
  }),
}));

const handleData = sdk.getHandles();

//注册handles
const { id: inputHandelId, value: inputValue } = sdk.register.handles.source("a", {
  type: ["IMAGE"],
});
const { id: outputHandelId, value: outputValue } = sdk.register.handles.target("b", {
  type: "STRING",
  value: "123123123",
});

//双向绑定输入输出数据编辑器
const outputJson = computed({
  get: () => JSON.stringify(outputValue.value, null, 2),
  set: (val: string) => {
    try {
      outputValue.value = JSON.parse(val);
    } catch {}
  },
});

//能力调用
const fnResult = ref<any>(null);
async function selectFnAssets() {
  const res = await sdk.fn.sql("o_image").orderBy("id", "desc").limit(10).offset(0).select("*");
  fnResult.value = res;
}

//文件读写删
const fileName = ref("test.txt");
const fileContent = ref("hello toonflow");
const fileReadResult = ref<string | null>(null);

async function fileWrite() {
  try {
    await sdk.fn.file.write(fileName.value, fileContent.value);
    MessagePlugin.success(`已写入：${fileName.value}`);
  } catch (e: any) {
    MessagePlugin.error(`写入失败：${e?.message ?? e}`);
  }
}

async function fileGet() {
  try {
    const res = await sdk.fn.file.get(fileName.value);
    fileReadResult.value = typeof res === "string" ? res : res.data;
    MessagePlugin.success(`已读取：${fileName.value}`);
  } catch (e: any) {
    MessagePlugin.error(`读取失败：${e?.message ?? e}`);
  }
}

async function fileDelete() {
  try {
    await sdk.fn.file.delete(fileName.value);
    fileReadResult.value = null;
    MessagePlugin.success(`已删除：${fileName.value}`);
  } catch (e: any) {
    MessagePlugin.error(`删除失败：${e?.message ?? e}`);
  }
}

const isValidConnection: ValidConnectionFunc = (connection, elements) => {
  const { canConnect, failReason } = sdk.checkConnection({ connection, elements });
  if (!canConnect) {
    MessagePlugin.warning(`连接失败：${failReason}`);
  }
  return canConnect;
};
</script>

<style lang="scss" scoped>
.test {
  position: relative;
  width: 1000px;
  border: 1px solid #e0e6f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  // overflow: visible 允许内部元素（如 tooltip、dropdown）超出节点边界
  overflow: visible;

  .testLayout {
    display: flex;
    gap: 0;
    height: 800px;

    .testLeft {
      flex: 1;
      min-width: 0;
      border-right: 1px solid #e0e6f0;
      padding: 12px;
      display: flex;
      flex-direction: column;

      .testSectionTitle {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 8px;
      }

      .testTabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;

        :deep(.t-tabs__content) {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        :deep(.t-tab-panel) {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 8px 0 0;
        }
      }

      .testDataEdit {
        flex: 1;
        resize: none;
        font-size: 12px;
        font-family: "Cascadia Code", "Consolas", monospace;
        color: #4a5568;
        background: #f8fafc;
        border: 1px solid #e0e6f0;
        border-radius: 4px;
        padding: 8px;
        outline: none;
        line-height: 1.5;
        width: 100%;
        box-sizing: border-box;

        &:focus {
          border-color: #6366f1;
          background: #fff;
        }
      }
    }

    .testRight {
      flex: 1;
      min-width: 0;
      padding: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .testRightTabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;

        :deep(.t-tabs__content) {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        :deep(.t-tab-panel) {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          padding: 8px 0 0;
        }
      }

      .testRightPanel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        overflow-y: auto;
        padding-right: 2px;

        .testSubTitle {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 4px;
        }

        .testHandleRow {
          display: flex;
          align-items: center;
          gap: 8px;

          .testHandleId {
            font-size: 12px;
            color: #4a5568;
            font-family: monospace;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .testCounter {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          .testCounterTag {
            min-width: 48px;
            text-align: center;
            font-size: 14px;
            font-weight: 600;
          }
        }

        .testFileActions {
          display: flex;
          gap: 6px;
        }

        .testDragArea {
          padding: 10px;
          background: #eff6ff;
          border: 1px dashed #93c5fd;
          border-radius: 4px;
          font-size: 12px;
          color: #3b82f6;
          cursor: default;
          text-align: center;
          user-select: none;
        }

        .testScrollArea {
          height: 100px;
          overflow-y: auto;
          background: #f8fafc;
          border: 1px solid #e0e6f0;
          border-radius: 4px;
          padding: 6px 8px;

          p {
            margin: 0;
            font-size: 12px;
            color: #64748b;
            line-height: 1.8;
          }
        }

        .testDataEdit {
          resize: none;
          font-size: 12px;
          font-family: "Cascadia Code", "Consolas", monospace;
          color: #4a5568;
          background: #f8fafc;
          border: 1px solid #e0e6f0;
          border-radius: 4px;
          padding: 8px;
          outline: none;
          line-height: 1.5;
          width: 100%;
          box-sizing: border-box;
          flex: 1;
          min-height: 80px;

          &:focus {
            border-color: #6366f1;
            background: #fff;
          }
        }
      }
    }
  }
}
</style>
