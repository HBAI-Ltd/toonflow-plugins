import { h, type VNode } from "snabbdom";
import type { IDomEditor, SlateElement } from "@wangeditor/editor";
import { Boot, DomEditor, SlateEditor, SlateTransforms } from "@wangeditor/editor";

type TrackAction = "add" | "del";

type TrackItem = {
  action: TrackAction;
  content: string;
};

type TrackGroupElement = SlateElement & {
  type: "track-group";
  items: TrackItem[];
  children: { text: string }[];
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function getTrackText(items: TrackItem[], keepAdditions: boolean) {
  return items
    .filter((item) => item.action === (keepAdditions ? "add" : "del"))
    .map((item) => item.content)
    .join("");
}

function applyTrackGroup(editor: IDomEditor, elem: TrackGroupElement, keepAdditions: boolean) {
  const path = DomEditor.findPath(editor, elem);
  const text = getTrackText(elem.items || [], keepAdditions);

  SlateEditor.withoutNormalizing(editor, () => {
    SlateTransforms.removeNodes(editor, { at: path });

    if (text) {
      SlateTransforms.insertNodes(editor, { text }, { at: path });
    }
  });
}

function renderTrackGroup(elem: SlateElement, children: VNode[] | null, editor: IDomEditor): VNode {
  const { items = [] } = elem as TrackGroupElement;

  return h(
    "span",
    {
      props: {
        className: "trackGroup",
        contentEditable: false,
      },
    },
    [
      ...items.map((item) =>
        h(
          "span",
          {
            props: {
              className: `trackItem ${item.action === "add" ? "trackAdd" : "trackDel"}`,
            },
          },
          item.content,
        ),
      ),
      h(
        "span",
        {
          props: {
            className: "trackActions",
          },
        },
        [
          h(
            "button",
            {
              props: {
                className: "trackBtn trackAccept",
                type: "button",
              },
              on: {
                mousedown(event: MouseEvent) {
                  event.preventDefault();
                },
                click(event: MouseEvent) {
                  event.preventDefault();
                  applyTrackGroup(editor, elem as TrackGroupElement, true);
                },
              },
            },
            "✓",
          ),
          h(
            "button",
            {
              props: {
                className: "trackBtn trackReject",
                type: "button",
              },
              on: {
                mousedown(event: MouseEvent) {
                  event.preventDefault();
                },
                click(event: MouseEvent) {
                  event.preventDefault();
                  applyTrackGroup(editor, elem as TrackGroupElement, false);
                },
              },
            },
            "✗",
          ),
        ],
      ),
    ],
  );
}

function parseTrackGroupHtml(domElem: Element): TrackGroupElement {
  const items: TrackItem[] = [];

  Array.from(domElem.childNodes).forEach((node) => {
    if (node.nodeType !== globalThis.Node.ELEMENT_NODE) {
      return;
    }

    const child = node as HTMLElement;
    const tagName = child.tagName.toLowerCase();

    if (tagName !== "del" && tagName !== "ins") {
      return;
    }

    const content = child.textContent || "";
    if (!content) {
      return;
    }

    items.push({
      action: tagName === "ins" ? "add" : "del",
      content,
    });
  });

  return {
    type: "track-group",
    items,
    children: [{ text: "" }],
  };
}

function trackGroupToHtml(elem: SlateElement): string {
  const { items = [] } = elem as TrackGroupElement;
  const inner = items
    .map((item) => {
      const tagName = item.action === "add" ? "ins" : "del";
      return `<${tagName}>${escapeHtml(item.content)}</${tagName}>`;
    })
    .join("");

  return `<tg>${inner}</tg>`;
}

export function registerTgModule() {
  Boot.registerModule({
    renderElems: [
      {
        type: "track-group",
        renderElem: renderTrackGroup,
      },
    ],
    elemsToHtml: [
      {
        type: "track-group",
        elemToHtml: trackGroupToHtml,
      },
    ],
    parseElemsHtml: [
      {
        selector: "tg",
        parseElemHtml: parseTrackGroupHtml,
      },
    ],
    editorPlugin(editor) {
      const newEditor = editor;
      const { isInline, isVoid } = newEditor;

      newEditor.isInline = (elem) => {
        if (DomEditor.checkNodeType(elem, "track-group")) {
          return true;
        }
        return isInline(elem);
      };

      newEditor.isVoid = (elem) => {
        if (DomEditor.checkNodeType(elem, "track-group")) {
          return true;
        }
        return isVoid(elem);
      };

      return newEditor;
    },
  });
}
