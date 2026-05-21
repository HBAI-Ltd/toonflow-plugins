import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import manifest from "../manifest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../dist");

// 将 manifest 写入 dist/manifest.json，并附带每次构建变化的 buildTime，
// 供宿主对比该时间戳判断插件是否更新、需要重载。
export default function writeManifest() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const output = {
    ...manifest,
    buildTime: Date.now(),
  };

  fs.writeFileSync(
    resolve(outDir, "manifest.json"),
    JSON.stringify(output, null, 2),
  );
  console.log(`manifest written, buildTime: ${output.buildTime}`);
}
