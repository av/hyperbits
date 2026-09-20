import type { RegistryItem } from "./bit-schema";

export type { RegistryItem };

export interface BitCatalogSummary {
  exportName: string;
  id: string;
  name: string;
  description: string;
  tags: string[];
  duration: number;
  width?: number;
  height?: number;
  sourcePath: string;
  componentNames: string[];
  registryDependencies: string[];
  helpers: string[];
}

export interface BitCatalogEntry extends BitCatalogSummary {
  sourceCode: string;
  embedSnippet: string;
  helperScriptTag: string;
}

export interface FindBitsOptions {
  query?: string;
  tags?: string[];
  limit?: number;
}

export type BitCatalogResolutionReason =
  | "id"
  | "name"
  | "not-found"
  | "ambiguous-name";

export interface BitCatalogResolution {
  entry: BitCatalogSummary | null;
  reason: BitCatalogResolutionReason;
  matches?: string[];
}

export interface SharedBitInventoryEntry extends BitCatalogSummary {
  sourceCode: string;
  registry: RegistryItem;
}

export const DEFAULT_ADD_DIR = "compositions";
