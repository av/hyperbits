export const BIT_CATEGORIES = [
  "text-animations",
  "staggered-motion",
  "background-effects",
  "particles",
  "scenes-3d",
  "full-compositions",
] as const;

export type BitCategory = (typeof BIT_CATEGORIES)[number];

export const REGISTRY_ITEM_TYPES = [
  "hyperframes:example",
  "hyperframes:block",
  "hyperframes:component",
] as const;

export const REGISTRY_FILE_TYPES = [
  "hyperframes:composition",
  "hyperframes:asset",
  "hyperframes:snippet",
  "hyperframes:style",
  "hyperframes:timeline",
] as const;

export const HELPER_NAMES = [
  "interpolate",
  "stagger",
  "color",
  "gradient",
  "random",
  "particles",
  "viewport",
  "text",
  "counter",
  "code",
  "scene3d",
] as const;

export const REGISTRY_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const HYPERBITS_UNPKG_IIFE =
  "https://unpkg.com/hyperbits/dist/hyperbits.iife.js";

export const HYPERBITS_LOCAL_IIFE = "../../../dist/hyperbits.iife.js";

export type RegistryFile = {
  path: string;
  target: string;
  type: (typeof REGISTRY_FILE_TYPES)[number];
  url?: string;
};

export type RegistryItem = {
  $schema?: string;
  name: string;
  type: (typeof REGISTRY_ITEM_TYPES)[number];
  title: string;
  description: string;
  tags?: string[];
  license?: string;
  dimensions: { width: number; height: number };
  duration: number;
  files: RegistryFile[];
};

export type BitManifest = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  duration: number;
  width: number;
  height: number;
  helpers: string[];
  registryItem: RegistryItem;
};

export type BitValidationIssue = {
  path: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function issue(path: string, message: string): BitValidationIssue {
  return { path, message };
}

export function validateRegistryItem(
  value: unknown,
  path = "registryItem",
): BitValidationIssue[] {
  if (!isRecord(value)) {
    return [issue(path, "must be an object")];
  }

  const issues: BitValidationIssue[] = [];
  const name = value.name;
  const type = value.type;
  const title = value.title;
  const description = value.description;
  const files = value.files;

  if (typeof name !== "string" || !REGISTRY_NAME_PATTERN.test(name)) {
    issues.push(
      issue(
        `${path}.name`,
        "must be a kebab-case registry name matching ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$",
      ),
    );
  }
  if (
    typeof type !== "string" ||
    !REGISTRY_ITEM_TYPES.includes(type as (typeof REGISTRY_ITEM_TYPES)[number])
  ) {
    issues.push(
      issue(`${path}.type`, `must be one of ${REGISTRY_ITEM_TYPES.join(", ")}`),
    );
  }
  if (typeof title !== "string" || title.length < 1) {
    issues.push(issue(`${path}.title`, "must be a non-empty string"));
  }
  if (typeof description !== "string" || description.length < 1) {
    issues.push(issue(`${path}.description`, "must be a non-empty string"));
  }
  if (value.tags !== undefined && !isStringArray(value.tags)) {
    issues.push(issue(`${path}.tags`, "must be an array of strings"));
  }
  if (!isRecord(value.dimensions)) {
    issues.push(
      issue(`${path}.dimensions`, "must be an object with width and height"),
    );
  } else {
    if (
      typeof value.dimensions.width !== "number" ||
      !Number.isInteger(value.dimensions.width) ||
      value.dimensions.width < 1
    ) {
      issues.push(
        issue(`${path}.dimensions.width`, "must be a positive integer"),
      );
    }
    if (
      typeof value.dimensions.height !== "number" ||
      !Number.isInteger(value.dimensions.height) ||
      value.dimensions.height < 1
    ) {
      issues.push(
        issue(`${path}.dimensions.height`, "must be a positive integer"),
      );
    }
  }
  if (typeof value.duration !== "number" || !(value.duration > 0)) {
    issues.push(issue(`${path}.duration`, "must be a number greater than 0"));
  }
  if (!Array.isArray(files) || files.length < 1) {
    issues.push(issue(`${path}.files`, "must be a non-empty array"));
  } else {
    files.forEach((file, index) => {
      const filePath = `${path}.files[${index}]`;
      if (!isRecord(file)) {
        issues.push(issue(filePath, "must be an object"));
        return;
      }
      if (typeof file.path !== "string" || file.path.length < 1) {
        issues.push(issue(`${filePath}.path`, "must be a non-empty string"));
      }
      if (typeof file.target !== "string" || file.target.length < 1) {
        issues.push(issue(`${filePath}.target`, "must be a non-empty string"));
      } else if (
        file.target.includes("..") ||
        file.target.startsWith("/") ||
        /^[A-Za-z]:[\\/]/.test(file.target)
      ) {
        issues.push(
          issue(
            `${filePath}.target`,
            "must stay inside the project (no .. or absolute paths)",
          ),
        );
      }
      if (
        typeof file.type !== "string" ||
        !REGISTRY_FILE_TYPES.includes(
          file.type as (typeof REGISTRY_FILE_TYPES)[number],
        )
      ) {
        issues.push(
          issue(
            `${filePath}.type`,
            `must be one of ${REGISTRY_FILE_TYPES.join(", ")}`,
          ),
        );
      }
    });
  }

  return issues;
}

export function validateBitManifest(value: unknown): BitValidationIssue[] {
  if (!isRecord(value)) {
    return [issue("", "bit.json must be an object")];
  }

  const issues: BitValidationIssue[] = [];
  if (
    typeof value.name !== "string" ||
    !REGISTRY_NAME_PATTERN.test(value.name)
  ) {
    issues.push(
      issue(
        "name",
        "must be a kebab-case registry name matching ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$",
      ),
    );
  }
  if (typeof value.title !== "string" || value.title.length < 1) {
    issues.push(issue("title", "must be a non-empty string"));
  }
  if (typeof value.description !== "string" || value.description.length < 1) {
    issues.push(issue("description", "must be a non-empty string"));
  }
  if (!isStringArray(value.tags) || value.tags.length < 1) {
    issues.push(issue("tags", "must be a non-empty array of strings"));
  }
  if (typeof value.duration !== "number" || !(value.duration > 0)) {
    issues.push(issue("duration", "must be a number greater than 0 (seconds)"));
  }
  if (
    typeof value.width !== "number" ||
    !Number.isInteger(value.width) ||
    value.width < 1
  ) {
    issues.push(issue("width", "must be a positive integer"));
  }
  if (
    typeof value.height !== "number" ||
    !Number.isInteger(value.height) ||
    value.height < 1
  ) {
    issues.push(issue("height", "must be a positive integer"));
  }
  if (!isStringArray(value.helpers)) {
    issues.push(issue("helpers", "must be an array of helper names"));
  } else {
    for (const helper of value.helpers) {
      if (!HELPER_NAMES.includes(helper as (typeof HELPER_NAMES)[number])) {
        issues.push(issue("helpers", `unknown helper "${helper}"`));
      }
    }
  }

  issues.push(...validateRegistryItem(value.registryItem));

  if (isRecord(value.registryItem)) {
    if (
      typeof value.name === "string" &&
      value.registryItem.name !== value.name
    ) {
      issues.push(issue("registryItem.name", "must match bit name"));
    }
    if (
      typeof value.title === "string" &&
      value.registryItem.title !== value.title
    ) {
      issues.push(issue("registryItem.title", "must match bit title"));
    }
    if (
      typeof value.duration === "number" &&
      value.registryItem.duration !== value.duration
    ) {
      issues.push(issue("registryItem.duration", "must match bit duration"));
    }
    if (isRecord(value.registryItem.dimensions)) {
      if (value.registryItem.dimensions.width !== value.width) {
        issues.push(
          issue("registryItem.dimensions.width", "must match bit width"),
        );
      }
      if (value.registryItem.dimensions.height !== value.height) {
        issues.push(
          issue("registryItem.dimensions.height", "must match bit height"),
        );
      }
    }
  }

  return issues;
}
