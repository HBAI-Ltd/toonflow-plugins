import { defineConfig, type LibraryFormats } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { TDesignResolver } from "@tdesign-vue-next/auto-import-resolver";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";
import manifest from "./manifest";

// 通过环境变量指定当前打包的节点名称
const nodeName = process.env.NODE_NAME;

export default defineConfig(() => {
  if (!nodeName) {
    throw new Error("[vite.config] 未指定 NODE_NAME 环境变量，请通过 core/build.ts 编排打包");
  }

  const entry = manifest.nodes[nodeName];
  if (!entry) {
    throw new Error(`[vite.config] manifest.nodes 中找不到节点: ${nodeName}`);
  }

  return {
    resolve: {
      alias: {
        "#": __dirname,
        "@": resolve(__dirname, "src"),
      },
    },
    plugins: [
      vue(),
      AutoImport({
        dts: "types/auto-imports.d.ts",
        imports: ["vue", "pinia", "vue-router"],
        resolvers: [
          TDesignResolver({
            library: "vue-next",
          }),
        ],
      }),
      Components({
        dts: "types/components.d.ts",
        resolvers: [
          TDesignResolver({
            library: "vue-next",
          }),
        ],
      }),
      cssInjectedByJs(),
    ],
    build: {
      minify: false,
      sourcemap: false,
      outDir: resolve(__dirname, "dist"),
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, entry.path),
        name: `${manifest.id}:${nodeName}`,
        formats: ["umd"] as LibraryFormats[],
        fileName: () => `${nodeName}.umd.js`,
      },
      rollupOptions: {
        external: ["vue", "@vue-flow/core"],
        output: {
          globals: {
            vue: "Vue",
            "@vue-flow/core": "VueFlow",
          },
          exports: "named" as const,
        },
      },
    },
  };
});
