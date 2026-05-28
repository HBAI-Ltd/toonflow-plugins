import { ManifestType } from "#/core/manifestType";

const manifest: ManifestType = {
  manifest_version: 1,
  id: "toonflowPlugin",
  version: "1.0.0",
  ToonflowVersion: "1.0",
  displayName: "Toonflow官方插件",
  author: "toonflow",
  description: "A plugin for Toonflow",
  nodes: {
    //show
    assets: {
      path: "src/nodes/show/assets/index.vue",
      name: "资产库",
      sources: ["show"],
      description: "资产库",
      icon: "src/assets/logo.jpg",
    },
    script: {
      path: "src/nodes/show/script/index.vue",
      name: "剧本",
      sources: ["show"],
      description: "剧本",
      icon: "src/assets/logo.jpg",
    },
    scriptPlan: {
      path: "src/nodes/show/scriptPlan/index.vue",
      name: "导演计划",
      sources: ["show"],
      description: "导演计划",
      icon: "src/assets/logo.jpg",
    },
    storyboardTable: {
      path: "src/nodes/show/storyboardTable/index.vue",
      name: "分镜列表",
      sources: ["show"],
      description: "分镜列表",
      icon: "src/assets/logo.jpg",
    },
    storyboard: {
      path: "src/nodes/show/storyboard/index.vue",
      name: "分镜",
      sources: ["show"],
      description: "分镜",
      icon: "src/assets/logo.jpg",
    },
    //edit
    image: {
      path: "src/nodes/edit/image/index.vue",
      name: "图片",
      sources: ["edit"],
      description: "图片",
      icon: "src/assets/logo.jpg",
    },
    imageGenerate: {
      path: "src/nodes/edit/imageGenerate/index.vue",
      name: "生成图片",
      sources: ["edit"],
      description: "生成图片",
      icon: "src/assets/logo.jpg",
    },
  },
};

export default manifest;
