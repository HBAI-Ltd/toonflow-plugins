export interface NodeManifest {
  path: string;
  name: string;
  sources: ("show" | "edit")[];
  description?: string;
  icon?: string;
}

export interface ManifestType {
  manifest_version: 1;
  id: string;
  version: string;
  ToonflowVersion: string;
  displayName: string;
  author: string;
  description: string;
  nodes: Record<string, NodeManifest>;
}
