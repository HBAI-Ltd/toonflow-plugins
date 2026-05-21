import type { Plugin } from "vite";

// 把 html 产物重命名为扁平的 <节点名>.html。
// 多入口构建时 html 默认带源码目录前缀（如 src/text/index.html），
// 传入 nodeName 可直接确定目标文件名。
export default function flattenHtmlPlugin(nodeName: string): Plugin {
  return {
    name: "flatten-html-plugin",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (!fileName.endsWith(".html")) continue;

        const chunk = bundle[fileName];
        const newFileName = `${nodeName}.html`;
        if (newFileName === fileName) continue;

        chunk.fileName = newFileName;
        bundle[newFileName] = chunk;
        delete bundle[fileName];
      }
    },
  };
}
