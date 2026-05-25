/// <reference types="vite/client" />
import { MessagePlugin } from "tdesign-vue-next";

type I18nTranslate = (key: string, ...args: any[]) => string;

interface GlobalInjections {
  $t: I18nTranslate;
  $message: typeof MessagePlugin;
}

declare global {
  const $t: I18nTranslate;
  interface Window extends GlobalInjections {}
}

declare module "vue" {
  interface ComponentCustomProperties extends GlobalInjections {}
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.ico" {
  const content: string;
  export default content;
}

declare module "*.bmp" {
  const content: string;
  export default content;
}

declare module "*.avif" {
  const content: string;
  export default content;
}

declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.less";

declare module "@wangeditor/editor-for-vue" {
  import type { DefineComponent } from "vue";
  import type { IDomEditor, IEditorConfig, IToolbarConfig, SlateDescendant } from "@wangeditor/editor";

  export const Editor: DefineComponent<{
    mode?: string;
    defaultContent?: SlateDescendant[];
    defaultHtml?: string;
    defaultConfig?: Partial<IEditorConfig>;
    modelValue?: string;
  }>;

  export const Toolbar: DefineComponent<{
    editor?: IDomEditor;
    mode?: string;
    defaultConfig?: Partial<IToolbarConfig>;
  }>;
}