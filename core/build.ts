import { build, preview } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import manifest from "../manifest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const outDir = resolve(rootDir, "dist");
const configFile = resolve(rootDir, "vite.config.ts");

const isWatch = process.argv.includes("--watch");

async function run() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const nodeNames = Object.keys(manifest.nodes);
  console.log(`\n[build] 打包 ${nodeNames.length} 个节点: ${nodeNames.join(", ")}\n`);

  // vite.config.ts 在解析时读取 NODE_NAME 决定打包目标，逐个打包成各自的 UMD。
  // watch 模式下 vite 自身负责监听重打包，无需 nodemon。
  for (const name of nodeNames) {
    process.env.NODE_NAME = name;
    await build({ configFile, build: { watch: isWatch ? {} : null } });
  }

  // manifest.json 的 nodes 改为指向打包产物
  fs.writeFileSync(
    resolve(outDir, "manifest.json"),
    JSON.stringify(
      {
        ...manifest,
        nodes: Object.fromEntries(nodeNames.map((n) => [n, `${n}.umd.js`])),
        buildTime: Date.now(),
      },
      null,
      2,
    ),
  );

  // dev 模式下用 vite 自带的 preview 服务托管 dist，并放开 CORS 供宿主远程加载
  if (isWatch) {
    const server = await preview({
      build: { outDir },
      preview: { port: Number(process.env.PORT) || 5180, cors: true },
    });
    server.printUrls();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
