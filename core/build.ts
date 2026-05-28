import { build, preview, type PreviewServer, type Rollup } from "vite";
import { resolve, dirname, basename } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";
import { createHash } from "crypto";
import type { ManifestType } from "./manifestType";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const outDir = resolve(rootDir, "dist");
const configFile = resolve(rootDir, "vite.config.ts");
const manifestFile = resolve(rootDir, "manifest.ts");
const isWatch = process.argv.includes("--watch");

type Watcher = Rollup.RollupWatcher;

const watchers = new Map<string, Watcher>();
const hashes = new Map<string, string>();
let previewServer: PreviewServer | null = null;
let building = false;
let pendingRebuild = false;

async function runOnce() {
  if (building) {
    pendingRebuild = true;
    return;
  }
  building = true;

  try {
    const manifest: ManifestType = (await import(`${pathToFileURL(manifestFile).href}?t=${Date.now()}`)).default;
    const names = Object.keys(manifest.nodes);
    const nextHashes = new Map(names.map((n) => [n, createHash("md5").update(JSON.stringify(manifest.nodes[n])).digest("hex")]));
    const removed = [...hashes.keys()].filter((n) => !nextHashes.has(n));
    const changed = names.filter((n) => hashes.get(n) !== nextHashes.get(n));

    if (!hashes.size) {
      fs.rmSync(outDir, { recursive: true, force: true });
      fs.mkdirSync(outDir, { recursive: true });
      console.log(`\n[build] 打包 ${names.length} 个节点: ${names.join(", ")}\n`);
    } else if (!removed.length && !changed.length) {
      console.log("\n[build] manifest 与上次一致，跳过重新打包\n");
      return;
    } else {
      console.log(`\n[build] 增量打包: 变更 [${changed.join(", ") || "无"}] 移除 [${removed.join(", ") || "无"}]\n`);
    }

    for (const name of [...removed, ...changed]) {
      await watchers
        .get(name)
        ?.close()
        .catch(() => {});
      watchers.delete(name);
      const file = resolve(outDir, `${name}.umd.js`);
      if (fs.existsSync(file)) fs.rmSync(file);
    }

    for (const name of changed) {
      process.env.NODE_NAME = name;
      const result = await build({ configFile, build: { watch: isWatch ? {} : null } });
      if (isWatch && typeof (result as Watcher).close === "function") {
        watchers.set(name, result as Watcher);
      }
    }

    hashes.clear();
    for (const [k, v] of nextHashes) hashes.set(k, v);

    const iconDir = resolve(outDir, "icon");
    fs.rmSync(iconDir, { recursive: true, force: true });
    const iconBySource = new Map<string, string>();
    const nodeIconOut: Record<string, string> = {};
    for (const n of names) {
      const iconSrc = manifest.nodes[n].icon;
      if (!iconSrc) continue;
      const absSrc = resolve(rootDir, iconSrc);
      if (!fs.existsSync(absSrc)) {
        console.warn(`[build] 节点 ${n} 的 icon 不存在: ${iconSrc}`);
        continue;
      }
      let outName = iconBySource.get(absSrc);
      if (!outName) {
        outName = basename(absSrc);
        const used = new Set(iconBySource.values());
        while (used.has(outName)) outName = `${n}_${basename(absSrc)}`;
        if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });
        fs.copyFileSync(absSrc, resolve(iconDir, outName));
        iconBySource.set(absSrc, outName);
      }
      nodeIconOut[n] = `icon/${outName}`;
    }

    fs.writeFileSync(
      resolve(outDir, "manifest.json"),
      JSON.stringify(
        {
          ...manifest,
          nodes: Object.fromEntries(
            names.map((n) => [n, { ...manifest.nodes[n], path: `${n}.umd.js`, icon: nodeIconOut[n] }]),
          ),
          buildTime: Date.now(),
        },
        null,
        2,
      ),
    );

    if (isWatch && !previewServer) {
      previewServer = await preview({
        build: { outDir },
        preview: { port: Number(process.env.PORT) || 5180, cors: true, host: true },
      });
      previewServer.printUrls();
    }
  } finally {
    building = false;
    if (pendingRebuild) {
      pendingRebuild = false;
      runOnce().catch(console.error);
    }
  }
}

runOnce()
  .then(() => {
    if (isWatch) {
      let timer: NodeJS.Timeout;
      fs.watch(manifestFile, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          console.log("\n[build] 检测到 manifest.ts 变更，检查增量...\n");
          runOnce().catch(console.error);
        }, 150);
      });
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
