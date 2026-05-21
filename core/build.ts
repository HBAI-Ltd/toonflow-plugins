import { build, type InlineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { rmSync } from "fs";
import { viteSingleFile } from "vite-plugin-singlefile";
import vue from "@vitejs/plugin-vue";
import flattenHtmlPlugin from "./flattenHtmlPlugin";
import writeManifest from "./writeManifest";
import manifest from "../manifest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes("--watch");
const distDir = resolve(__dirname, "../dist");

// 单个节点的构建配置：内联成自包含的 <节点名>.html
function nodeConfig(nodeName: string, entry: string): InlineConfig {
  return {
    configFile: false,
    resolve: {
      alias: {
        "#": resolve(__dirname, ".."),
        "@": resolve(__dirname, "../src"),
      },
    },
    plugins: [
      vue(),
      viteSingleFile(), // 将 JS/CSS 内联进 html
      flattenHtmlPlugin(nodeName), // 产物重命名为 <节点名>.html
      // watch 模式下，每个节点重建后刷新 manifest 的 buildTime
      {
        name: "write-manifest-after-bundle",
        writeBundle() {
          writeManifest();
        },
      },
    ],
    build: {
      minify: false,
      sourcemap: false,
      outDir: distDir,
      emptyOutDir: false, // 多节点共用 dist，不能各自清空
      watch: isWatch ? {} : null,
      rollupOptions: {
        input: { [nodeName]: resolve(__dirname, "..", entry) },
      },
    },
  };
}

async function run() {
  // 构建开始时清空一次 dist
  rmSync(distDir, { recursive: true, force: true });

  // viteSingleFile 关闭了代码分割，多入口无法在同一次构建中处理，
  // 因此逐个节点单独构建。
  for (const [nodeName, entry] of Object.entries(manifest.nodes)) {
    await build(nodeConfig(nodeName, entry));
  }

  // 非 watch 模式下，构建结束写一次 manifest
  if (!isWatch) {
    writeManifest();
  }
}

run();
