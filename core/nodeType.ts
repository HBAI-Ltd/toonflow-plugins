type HandelType = "IMAGE" | "TEXT" | "NUMBER" | "BOOLEAN";

interface DefaultNode {
  id: string;
  name: string;
  data: Record<string, any>;
}

export interface ShowNode extends DefaultNode {
  sources: "show";
}

export interface EditNode extends DefaultNode {
  sources: "edit";
  inputs: {
    [key: string]: {
      type: HandelType;
      value: any;
    };
  };
  outputs: {
    [key: string]: {
      type: HandelType;
    };
  };
}