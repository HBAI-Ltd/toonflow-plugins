export type HANDLE_TYPE_PRIMITIVE = "INT" | "FLOAT" | "STRING" | "BOOLEAN";
export type HANDLE_TYPE_MEDIA = "IMAGE" | "MASK" | "AUDIO" | "VIDEO";
export type HANDLE_TYPE_COMPUTE = "LATENT" | "CONDITIONING";

export type HANDLE_TYPE = HANDLE_TYPE_PRIMITIVE | HANDLE_TYPE_MEDIA | HANDLE_TYPE_COMPUTE | "ANY";

export interface ImageData {
  url: string;
  name?: string;
  width?: number;
  height?: number;
  format?: "png" | "jpg" | "webp" | "gif";
}

export interface MaskData {
  url: string;
  name?: string;
  width?: number;
  height?: number;
}

export interface AudioData {
  url: string;
  name?: string;
  duration?: number;
  sampleRate?: number;
  format?: "mp3" | "wav" | "flac" | "ogg";
}

export interface VideoData {
  url: string;
  name?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  format?: "mp4" | "webm";
}

export interface LatentData {
  url: string;
  width: number;
  height: number;
  batchSize?: number;
}

export interface ConditioningData {
  text: string;
  strength?: number;
}

export type HANDLE_VALUE_MAP = {
  INT: number;
  FLOAT: number;
  STRING: string;
  BOOLEAN: boolean;
  IMAGE: ImageData;
  MASK: MaskData;
  AUDIO: AudioData;
  VIDEO: VideoData;
  LATENT: LatentData;
  CONDITIONING: ConditioningData;
  ANY: unknown;
};

export interface HANDLEDATA<T extends HANDLE_TYPE = HANDLE_TYPE> {
  type: T;
  value: HANDLE_VALUE_MAP[T];
}

export interface HANDLEDOPT {
  inputs?: {
    [handleId: string]: HANDLE_TYPE[];
  };
  outputs?: {
    [handleId: string]: {
      type: HANDLE_TYPE[];
      value?: HANDLE_VALUE_MAP[HANDLE_TYPE] | null;
    };
  };
}
