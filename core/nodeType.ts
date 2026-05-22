export interface OUTPUT {
  type: "IMAGE" | "TEXT" | "NUMBER" | "BOOLEAN";
  value: any;
}

export interface METADATA {
  icon?: string;
  name: string;
  sources: ("show" | "edit")[];
  defaultData: any;
  inputs: {
    [handleId: string]: OUTPUT;
  };
  outputs: {
    [handleId: string]: OUTPUT;
  };
}