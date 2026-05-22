import { ManifestType } from "#/core/manifestType";

const manifest: ManifestType = {
  manifest_version: 1,
  name: "toonflowPluginDemo",
  version: "1.0.0",
  ToonflowVersion: "1.0",
  displayName: "Toonflow Plugin Demo",
  author: "toonflow",
  nativeDependencies: ["sharp"],
  nodes: {
    text: "src/nodes/text/index.vue",
  },
};

export default manifest;
