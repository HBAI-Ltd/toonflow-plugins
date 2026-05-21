export interface ManifestType {
  manifest_version: 1;
  name: string;
  version: string;
  ToonflowVersion: string;
  displayName: string;
  author: string;
  nativeDependencies: string[];
  nodes: Record<string, string>;
}
